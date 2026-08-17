import connectDB from "@/lib/db";
import { OrderModificationRequest } from "@/models";
import { OrderRequestCard, type OrderRequestCardData } from "@/components/admin/OrderRequestCard";
import { PageHeader } from "@/components/admin/PageHeader";
import { serializeAdmin } from "@/lib/admin/serialize";

export const dynamic = "force-dynamic";

export default async function AdminOrderRequestsPage() {
  await connectDB();

  const requests = serializeAdmin(
    await OrderModificationRequest.find()
      .populate("orderId", "orderNumber totalCents customerName")
      .populate("userId", "name email")
      .populate("processedBy", "name")
      .sort({ createdAt: -1 })
      .lean()
  ) as unknown as OrderRequestCardData[];

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const processedRequests = requests.filter((r) => r.status !== "pending");

  return (
    <div>
      <PageHeader
        title="Order Modification Requests"
        description="Review and process customer order modification requests"
      />

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-4">
          <p className="text-sm text-yellow-700">Pending</p>
          <p className="font-display text-3xl font-bold text-yellow-900">
            {pendingRequests.length}
          </p>
        </div>
        <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4">
          <p className="text-sm text-green-700">Approved</p>
          <p className="font-display text-3xl font-bold text-green-900">
            {requests.filter((r) => r.status === "approved").length}
          </p>
        </div>
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4">
          <p className="text-sm text-red-700">Rejected</p>
          <p className="font-display text-3xl font-bold text-red-900">
            {requests.filter((r) => r.status === "rejected").length}
          </p>
        </div>
      </div>

      {/* Pending Requests */}
      {pendingRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            ⏳ Pending Requests ({pendingRequests.length})
          </h2>
          <div className="space-y-4">
            {pendingRequests.map((request) => (
              <OrderRequestCard key={String(request._id)} request={request} />
            ))}
          </div>
        </div>
      )}

      {/* Processed Requests */}
      {processedRequests.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">
            ✓ Processed Requests ({processedRequests.length})
          </h2>
          <div className="space-y-4">
            {processedRequests.map((request) => (
              <OrderRequestCard key={String(request._id)} request={request} />
            ))}
          </div>
        </div>
      )}

      {/* No Requests */}
      {requests.length === 0 && (
        <div className="rounded-lg bg-white/5 border border-white/10 p-12 text-center">
          <p className="text-white/60">No order modification requests yet.</p>
        </div>
      )}
    </div>
  );
}
