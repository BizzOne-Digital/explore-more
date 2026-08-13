import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { Order, Donation } from "@/models";

export async function GET() {
  try {
    const sessionResult = await requireRole(["parent"]);
    if ("error" in sessionResult) return sessionResult.error;

    await connectDB();

    const [orders, donations] = await Promise.all([
      Order.find({
        $or: [{ userId: sessionResult.user.id }, { customerEmail: sessionResult.user.email }],
        paymentStatus: { $in: ["paid", "manual"] },
      })
        .sort({ createdAt: -1 })
        .limit(50),
      Donation.find({ donorEmail: sessionResult.user.email, paymentStatus: "paid" })
        .sort({ createdAt: -1 })
        .limit(50),
    ]);

    const receipts = [
      ...orders.map((o) => ({
        id: o._id,
        type: "order" as const,
        number: o.orderNumber,
        date: o.createdAt,
        description: o.items.map((i) => i.title).join(", "),
        amountCents: o.totalCents,
        status: o.paymentStatus,
        paymentMethod: o.stripePaymentIntentId ? "Card" : "Manual",
      })),
      ...donations.map((d) => ({
        id: d._id,
        type: "donation" as const,
        number: `DON-${d._id.toString().slice(-8).toUpperCase()}`,
        date: d.createdAt,
        description: "Donation",
        amountCents: d.amountCents,
        status: d.paymentStatus,
        paymentMethod: "Card",
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return apiSuccess(receipts);
  } catch (error) {
    return apiError(error);
  }
}
