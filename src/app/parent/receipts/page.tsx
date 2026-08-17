import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import { Order, Donation } from "@/models";
import { formatCents } from "@/lib/utils";
import { OrderModificationButton } from "@/components/parent/OrderModificationButton";

export default async function ParentReceiptsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/parent/receipts");

  await connectDB();

  const [orders, donations] = await Promise.all([
    Order.find({
      $or: [{ userId: session.user.id }, { customerEmail: session.user.email }],
      paymentStatus: { $in: ["paid", "manual"] },
    }).sort({ createdAt: -1 }),
    Donation.find({ donorEmail: session.user.email, paymentStatus: "paid" }).sort({ createdAt: -1 }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Receipts & Purchases</h2>
        <p className="mt-1 text-sm text-explore-charcoal/70">
          View tutoring payments, portfolio review fees, books, courses, events, and other purchases.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-explore-sand text-left">
            <tr>
              <th className="px-4 py-3">Receipt #</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o._id.toString()} className="border-t border-explore-charcoal/8">
                <td className="px-4 py-3 font-mono text-xs">{o.orderNumber}</td>
                <td className="px-4 py-3">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">{o.items.map((i) => i.title).join(", ")}</td>
                <td className="px-4 py-3 font-semibold">{formatCents(o.totalCents)}</td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                    o.paymentStatus === "paid" ? "bg-green-100 text-green-800" :
                    o.paymentStatus === "refunded" ? "bg-red-100 text-red-800" :
                    "bg-yellow-100 text-yellow-800"
                  }`}>
                    {o.paymentStatus}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {["paid", "pending"].includes(o.paymentStatus) && (
                    <OrderModificationButton
                      orderId={o._id.toString()}
                      orderNumber={o.orderNumber}
                    />
                  )}
                </td>
              </tr>
            ))}
            {donations.map((d) => (
              <tr key={d._id.toString()} className="border-t border-explore-charcoal/8">
                <td className="px-4 py-3 font-mono text-xs">DON-{d._id.toString().slice(-8).toUpperCase()}</td>
                <td className="px-4 py-3">{new Date(d.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">Donation</td>
                <td className="px-4 py-3 font-semibold">{formatCents(d.amountCents)}</td>
                <td className="px-4 py-3">
                  <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                    {d.paymentStatus}
                  </span>
                </td>
                <td className="px-4 py-3">-</td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && donations.length === 0 && (
          <p className="p-8 text-center text-sm text-explore-charcoal/60">No purchase history yet.</p>
        )}
      </div>
    </div>
  );
}
