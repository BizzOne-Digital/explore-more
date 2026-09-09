import { Book, Order } from "@/models";
import type { IOrder } from "@/models/Book";
import { sendBookOrderEmails } from "@/lib/email/order-notifications";
import {
  filterPendingDigitalItems,
  filterPhysicalItems,
  getDigitalDownloadsForOrder,
  getOrderBookDeliveryInfo,
} from "@/lib/orders/digital-downloads";

export async function fulfillBookOrder(
  orderId: string,
  stripeSession?: { id: string; payment_intent?: string | { id: string } | null }
): Promise<IOrder | null> {
  const existing = await Order.findById(orderId);
  if (!existing) return null;
  if (existing.paymentStatus === "paid") return existing;

  const update: Record<string, unknown> = { paymentStatus: "paid" };
  if (stripeSession) {
    update.stripeSessionId = stripeSession.id;
    update.stripePaymentIntentId =
      typeof stripeSession.payment_intent === "string"
        ? stripeSession.payment_intent
        : stripeSession.payment_intent?.id;
  }

  const order = await Order.findOneAndUpdate(
    { _id: orderId, paymentStatus: { $ne: "paid" } },
    update,
    { new: true }
  );

  if (!order) {
    return Order.findById(orderId);
  }

  for (const item of order.items) {
    await Book.findByIdAndUpdate(item.bookId, {
      $inc: { inventory: -item.quantity },
    });
  }

  const deliveryInfo = await getOrderBookDeliveryInfo(order);
  const digitalDownloads = await getDigitalDownloadsForOrder(order);
  const pendingDigital = filterPendingDigitalItems(deliveryInfo);
  const physicalItems = filterPhysicalItems(deliveryInfo);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.exploremoreacademy.com";

  try {
    await sendBookOrderEmails({
      orderNumber: order.orderNumber,
      orderId: order._id.toString(),
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      totalCents: order.totalCents,
      subtotalCents: order.subtotalCents,
      shippingCents: order.shippingCents,
      items: order.items.map((item) => ({
        title: item.title,
        quantity: item.quantity,
        priceCents: item.priceCents,
      })),
      shippingAddress: order.shippingAddress,
      digitalDownloads,
      pendingDigital,
      physicalItems,
      downloadPageUrl: `${appUrl}/order-success?order=${order.orderNumber}`,
    });
  } catch (err) {
    console.error("Book order emails failed:", err);
  }

  return order;
}
