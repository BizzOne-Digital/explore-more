import { z } from "zod";
import connectDB from "@/lib/db";
import { Book, Order, SiteSettings } from "@/models";
import { createCheckoutSession, getAppUrl, isStripeConfigured } from "@/lib/services/stripe";
import { generateOrderNumber } from "@/lib/password";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth-helpers";

const itemSchema = z.object({
  bookId: z.string(),
  quantity: z.number().int().min(1).max(99),
});

const checkoutSchema = z.object({
  items: z.array(itemSchema).min(1),
  shippingAddress: z.object({
    name: z.string().min(1),
    line1: z.string().min(1),
    line2: z.string().optional(),
    city: z.string().min(1),
    state: z.string().min(1),
    postalCode: z.string().min(1),
    country: z.string().default("US"),
  }),
  customerEmail: z.string().email(),
  customerName: z.string().min(1),
});

export async function POST(request: Request) {
  if (!isStripeConfigured()) {
    await connectDB();
    const settings = await SiteSettings.findOne();
    if (settings?.manualOrderMode) {
      return jsonError(
        "Online checkout is unavailable. Please contact us to place your order.",
        503
      );
    }
    return jsonError("Payment system is not configured", 503);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  await connectDB();

  const settings = await SiteSettings.findOne();
  const taxRate = settings?.taxRatePercent ?? 0;
  const shippingFlat = settings?.shippingFlatCents ?? 0;
  const freeShippingThreshold = settings?.freeShippingThresholdCents ?? 0;

  const orderItems: {
    bookId: typeof Book.prototype._id;
    title: string;
    quantity: number;
    priceCents: number;
  }[] = [];
  const lineItems: { price_data: { currency: string; product_data: { name: string }; unit_amount: number }; quantity: number }[] = [];

  let subtotalCents = 0;

  for (const item of parsed.data.items) {
    const book = await Book.findById(item.bookId);
    if (!book || !book.published) {
      return jsonError(`Book not found: ${item.bookId}`, 404);
    }
    if (book.inventory < item.quantity) {
      return jsonError(`Insufficient stock for "${book.title}"`, 400);
    }

    const priceCents = book.salePriceCents ?? book.priceCents;
    subtotalCents += priceCents * item.quantity;

    orderItems.push({
      bookId: book._id,
      title: book.title,
      quantity: item.quantity,
      priceCents,
    });

    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: { name: book.title },
        unit_amount: priceCents,
      },
      quantity: item.quantity,
    });
  }

  const taxCents = Math.round(subtotalCents * (taxRate / 100));
  const shippingCents =
    freeShippingThreshold > 0 && subtotalCents >= freeShippingThreshold ? 0 : shippingFlat;
  const totalCents = subtotalCents + taxCents + shippingCents;

  const sessionResult = await requireSession();
  const userId = "error" in sessionResult ? undefined : sessionResult.user.id;

  const order = await Order.create({
    userId,
    orderNumber: generateOrderNumber(),
    items: orderItems,
    subtotalCents,
    taxCents,
    shippingCents,
    totalCents,
    paymentStatus: "pending",
    shippingAddress: parsed.data.shippingAddress,
    customerEmail: parsed.data.customerEmail,
    customerName: parsed.data.customerName,
  });

  const appUrl = getAppUrl();
  const session = await createCheckoutSession({
    lineItems,
    mode: "payment",
    metadata: {
      checkoutType: "books",
      orderId: order._id.toString(),
    },
    customerEmail: parsed.data.customerEmail,
    successUrl: `${appUrl}/order-success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${appUrl}/cart`,
  });

  order.stripeSessionId = session.id;
  await order.save();

  return jsonOk({ sessionId: session.id, url: session.url, orderNumber: order.orderNumber });
}
