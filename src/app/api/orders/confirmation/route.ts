import connectDB from "@/lib/db";
import { Order } from "@/models";
import {
  isStripeConfigured,
  retrieveCheckoutSession,
} from "@/lib/services/stripe";
import {
  filterPendingDigitalItems,
  filterPhysicalItems,
  getDigitalDownloadsForOrder,
  getOrderBookDeliveryInfo,
} from "@/lib/orders/digital-downloads";
import { fulfillBookOrder } from "@/lib/orders/fulfill-book-order";
import { jsonOk, jsonError } from "@/lib/api/response";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("order");
    const sessionId = searchParams.get("session_id");

    if (!orderNumber && !sessionId) {
      return jsonError("order or session_id is required");
    }

    await connectDB();

    let order = orderNumber
      ? await Order.findOne({ orderNumber })
      : null;

    let stripeSession = null;
    if (sessionId && isStripeConfigured()) {
      stripeSession = await retrieveCheckoutSession(sessionId);
      if (!order && stripeSession?.metadata?.orderId) {
        order = await Order.findById(stripeSession.metadata.orderId);
      }
      if (!order) {
        order = await Order.findOne({ stripeSessionId: sessionId });
      }
    }

    if (!order) {
      return jsonError("Order not found", 404);
    }

    if (
      order.paymentStatus === "pending" &&
      stripeSession?.payment_status === "paid"
    ) {
      await fulfillBookOrder(order._id.toString(), stripeSession);
      order = await Order.findById(order._id);
    }

    if (!order) {
      return jsonError("Order not found", 404);
    }

    const isPaid = order.paymentStatus === "paid" || order.paymentStatus === "manual";
    const deliveryInfo = isPaid ? await getOrderBookDeliveryInfo(order) : [];
    const digitalDownloads = isPaid ? await getDigitalDownloadsForOrder(order) : [];
    const pendingDigital = filterPendingDigitalItems(deliveryInfo);
    const physicalItems = filterPhysicalItems(deliveryInfo);

    return jsonOk({
      orderNumber: order.orderNumber,
      orderId: order._id.toString(),
      paymentStatus: order.paymentStatus,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      totalCents: order.totalCents,
      items: order.items.map((item) => ({
        title: item.title,
        quantity: item.quantity,
        priceCents: item.priceCents,
      })),
      digitalDownloads: digitalDownloads.map((item) => ({
        ...item,
        orderId: order!._id.toString(),
      })),
      pendingDigital: pendingDigital.map((item) => ({
        bookId: item.bookId,
        title: item.title,
      })),
      physicalItems: physicalItems.map((item) => ({
        bookId: item.bookId,
        title: item.title,
      })),
    });
  } catch (error) {
    console.error("Order confirmation lookup error:", error);
    return jsonError("Could not load order", 500);
  }
}
