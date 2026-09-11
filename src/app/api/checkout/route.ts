import { NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { Book, Order, SiteSettings } from "@/models";
import { generateOrderNumber } from "@/lib/password";
import { createCheckoutSession, getAppUrl, getStripe } from "@/lib/services/stripe";
import { auth } from "@/lib/auth";
import { getBookPriceCents, isBookPublished } from "@/lib/pricing";
import { stripeProductData } from "@/lib/stripe/tax-codes";
import { fulfillBookOrder } from "@/lib/orders/fulfill-book-order";
import { cartRequiresShippingAddress } from "@/lib/orders/book-shipping";
import { isBookDigital } from "@/lib/books/is-digital";
import { buildCheckoutQuote } from "@/lib/orders/checkout-quote";

const addressSchema = z.object({
  name: z.string(),
  line1: z.string(),
  line2: z.string().optional(),
  city: z.string(),
  state: z.string(),
  postalCode: z.string(),
  country: z.string().default("US"),
});

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        bookId: z.string().min(1),
        title: z.string().min(1),
        quantity: z.coerce.number().int().min(1),
        priceCents: z.coerce.number().min(0),
      })
    )
    .min(1),
  customerName: z.string().trim().min(2),
  customerEmail: z.string().trim().email(),
  donationCents: z.coerce.number().int().min(0).max(500_000).optional(),
  shippingAddress: addressSchema.optional(),
  shippingOptionId: z.string().nullish(),
});

const STRIPE_MIN_CENTS = 50;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = checkoutSchema.parse(body);
    await connectDB();

    const session = await auth();

    const orderItems: Array<{
      bookId: string;
      title: string;
      quantity: number;
      priceCents: number;
      isDigital: boolean;
    }> = [];

    for (const item of data.items) {
      const book = await Book.findById(item.bookId);
      if (!book || !isBookPublished(book)) {
        return NextResponse.json({ error: `Book not available: ${item.title}` }, { status: 404 });
      }
      if (book.inventory < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for "${book.title}"` },
          { status: 400 }
        );
      }

      orderItems.push({
        bookId: book._id.toString(),
        title: book.title,
        quantity: item.quantity,
        priceCents: getBookPriceCents(book),
        isDigital: isBookDigital(book),
      });
    }

    const shippingLines = orderItems.map((item) => ({
      priceCents: item.priceCents,
      quantity: item.quantity,
      isDigital: item.isDigital,
    }));

    const needsAddress = cartRequiresShippingAddress(shippingLines);
    if (needsAddress && !data.shippingAddress) {
      return NextResponse.json(
        { error: "Please enter a shipping address for physical books." },
        { status: 400 }
      );
    }

    const settings = await SiteSettings.findOne().lean();
    const quote = await buildCheckoutQuote({
      items: shippingLines,
      shippingAddress: data.shippingAddress
        ? {
            line1: data.shippingAddress.line1,
            line2: data.shippingAddress.line2,
            city: data.shippingAddress.city,
            state: data.shippingAddress.state,
            postalCode: data.shippingAddress.postalCode,
            country: data.shippingAddress.country,
          }
        : undefined,
      shippingOptionId: data.shippingOptionId ?? undefined,
      siteSettings: settings
        ? {
            taxRatePercent: settings.taxRatePercent,
            shippingFlatCents: settings.shippingFlatCents,
            freeShippingThresholdCents: settings.freeShippingThresholdCents,
          }
        : undefined,
    });

    const subtotalCents = quote.subtotalCents;
    const shippingCents = quote.shippingCents;
    const taxCents = quote.taxCents;
    const donationCents = data.donationCents ?? 0;

    if (donationCents > 0 && donationCents < STRIPE_MIN_CENTS) {
      return NextResponse.json(
        { error: "Donations must be at least $0.50, or leave blank." },
        { status: 400 }
      );
    }

    if (donationCents > 0 && subtotalCents > 0) {
      return NextResponse.json(
        { error: "Optional donations are only available for free book orders." },
        { status: 400 }
      );
    }

    const totalCents = subtotalCents + shippingCents + taxCents + donationCents;
    const orderNumber = generateOrderNumber();

    const shippingAddress = data.shippingAddress ?? {
      name: data.customerName,
      line1: "Digital delivery",
      line2: "",
      city: "N/A",
      state: "N/A",
      postalCode: "00000",
      country: "US",
    };

    const order = await Order.create({
      userId: session?.user?.id,
      orderNumber,
      items: orderItems.map(({ bookId, title, quantity, priceCents }) => ({
        bookId,
        title,
        quantity,
        priceCents,
      })),
      subtotalCents,
      taxCents,
      shippingCents,
      donationCents,
      totalCents,
      paymentStatus: "pending",
      shippingAddress,
      customerEmail: data.customerEmail,
      customerName: data.customerName,
    });

    if (totalCents === 0) {
      await fulfillBookOrder(order._id.toString());
      return NextResponse.json({ success: true, orderNumber, free: true });
    }

    const stripe = getStripe();
    if (!stripe) {
      await fulfillBookOrder(order._id.toString());
      return NextResponse.json({ success: true, orderNumber, manual: true });
    }

    const lineItems = orderItems
      .filter((item) => item.priceCents > 0)
      .map((item) => ({
        price_data: {
          currency: "usd",
          product_data: stripeProductData({ name: item.title }, "books"),
          unit_amount: item.priceCents,
        },
        quantity: item.quantity,
      }));

    if (shippingCents > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: stripeProductData({ name: "Shipping" }, "books"),
          unit_amount: shippingCents,
        },
        quantity: 1,
      });
    }

    if (taxCents > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: stripeProductData({ name: "Sales tax" }, "books"),
          unit_amount: taxCents,
        },
        quantity: 1,
      });
    }

    if (donationCents > 0) {
      lineItems.push({
        price_data: {
          currency: "usd",
          product_data: stripeProductData({ name: "Optional donation" }, "donations"),
          unit_amount: donationCents,
        },
        quantity: 1,
      });
    }

    const checkoutSession = await createCheckoutSession({
      lineItems,
      mode: "payment",
      metadata: { checkoutType: "books", orderId: order._id.toString(), orderNumber },
      customerEmail: data.customerEmail,
      managedPayments: false,
      successUrl: `${getAppUrl()}/order-success?order=${orderNumber}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${getAppUrl()}/checkout`,
    });

    await Order.findByIdAndUpdate(order._id, { stripeSessionId: checkoutSession.id });

    return NextResponse.json({ checkoutUrl: checkoutSession.url, orderNumber });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const message =
        error.errors[0]?.message === "Required"
          ? "Please complete all required checkout fields."
          : error.errors[0]?.message ?? "Invalid checkout data";
      return NextResponse.json({ error: message }, { status: 400 });
    }
    console.error("Checkout error:", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
