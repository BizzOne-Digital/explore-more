import { NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { Book, Order } from "@/models";
import { generateOrderNumber } from "@/lib/password";
import { createCheckoutSession, getAppUrl, getStripe } from "@/lib/services/stripe";
import { auth } from "@/lib/auth";
import { getBookPriceCents, isBookPublished } from "@/lib/pricing";
import { stripeProductData } from "@/lib/stripe/tax-codes";

const checkoutSchema = z.object({
  items: z.array(
    z.object({
      bookId: z.string(),
      title: z.string(),
      quantity: z.number().min(1),
      priceCents: z.number(),
    })
  ),
  customerName: z.string().min(2),
  customerEmail: z.string().email(),
  shippingAddress: z.object({
    name: z.string(),
    line1: z.string(),
    line2: z.string().optional(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string().default("US"),
  }),
});

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
    }> = [];

    for (const item of data.items) {
      const book = await Book.findById(item.bookId);
      if (!book || !isBookPublished(book)) {
        return NextResponse.json({ error: `Book not available: ${item.title}` }, { status: 404 });
      }
      if (book.inventory < item.quantity) {
        return NextResponse.json({ error: `Insufficient stock for "${book.title}"` }, { status: 400 });
      }

      orderItems.push({
        bookId: book._id.toString(),
        title: book.title,
        quantity: item.quantity,
        priceCents: getBookPriceCents(book),
      });
    }

    const subtotalCents = orderItems.reduce((s, i) => s + i.priceCents * i.quantity, 0);
    const shippingCents = subtotalCents >= 5000 ? 0 : 599;
    const totalCents = subtotalCents + shippingCents;
    const orderNumber = generateOrderNumber();

    const order = await Order.create({
      userId: session?.user?.id,
      orderNumber,
      items: orderItems,
      subtotalCents,
      taxCents: 0,
      shippingCents,
      totalCents,
      paymentStatus: "pending",
      shippingAddress: data.shippingAddress,
      customerEmail: data.customerEmail,
      customerName: data.customerName,
    });

    const stripe = getStripe();
    if (!stripe) {
      await Order.findByIdAndUpdate(order._id, { paymentStatus: "manual" });
      return NextResponse.json({ success: true, orderNumber, manual: true });
    }

    const checkoutSession = await createCheckoutSession({
      lineItems: orderItems.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: stripeProductData({ name: item.title }, "books"),
          unit_amount: item.priceCents,
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      metadata: { checkoutType: "books", orderId: order._id.toString(), orderNumber },
      customerEmail: data.customerEmail,
      managedPayments: false,
      successUrl: `${getAppUrl()}/order-success?order=${orderNumber}`,
      cancelUrl: `${getAppUrl()}/checkout`,
    });

    await Order.findByIdAndUpdate(order._id, { stripeSessionId: checkoutSession.id });

    return NextResponse.json({ checkoutUrl: checkoutSession.url, orderNumber });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid checkout data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
