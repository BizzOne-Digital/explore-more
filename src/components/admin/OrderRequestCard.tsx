"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Check, X, Loader } from "lucide-react";

export interface OrderRequestCardData {
  _id: string | { toString(): string };
  requestType: "add_item" | "remove_item" | "cancel_order" | "change_address" | string;
  status: "pending" | "approved" | "rejected" | string;
  createdAt: string | Date;
  processedAt?: string | Date;
  adminNotes?: string;
  requestDetails?: {
    reason?: string;
  };
  orderId?: {
    orderNumber?: string;
  } | null;
  userId?: {
    name?: string;
    email?: string;
  } | null;
  processedBy?: {
    name?: string;
  } | null;
}

interface OrderRequestCardProps {
  request: OrderRequestCardData;
}

export function OrderRequestCard({ request }: OrderRequestCardProps) {
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [showNotes, setShowNotes] = useState(false);

  const requestTypeLabels = {
    add_item: "Add Item(s)",
    remove_item: "Remove Item(s)",
    cancel_order: "Cancel Order",
    change_address: "Change Shipping Address",
  };

  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
    approved: "bg-green-500/20 text-green-300 border-green-500/30",
    rejected: "bg-red-500/20 text-red-300 border-red-500/30",
  };

  async function handleProcess(action: "approve" | "reject") {
    if (!confirm(`Are you sure you want to ${action} this request?`)) {
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch(`/api/admin/order-requests/${request._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, adminNotes }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} request`);
      }

      alert(`Request ${action}ed successfully! Customer will be notified via email.`);
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to process request");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="rounded-lg bg-white/10 border border-white/20 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="font-semibold text-white">
              {requestTypeLabels[request.requestType as keyof typeof requestTypeLabels] ?? request.requestType}
            </h3>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                statusColors[request.status as keyof typeof statusColors] ?? statusColors.pending
              }`}
            >
              {String(request.status).toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-white/60">
            Order #{request.orderId?.orderNumber} • {request.userId?.name} ({request.userId?.email})
          </p>
          <p className="text-xs text-white/40 mt-1">
            Requested: {format(new Date(request.createdAt), "MMM dd, yyyy 'at' h:mm a")}
          </p>
        </div>
      </div>

      {request.requestDetails?.reason && (
        <div className="rounded-lg bg-white/5 border border-white/10 p-4 mb-4">
          <p className="text-sm font-semibold text-white mb-2">Reason:</p>
          <p className="text-sm text-white/70">{request.requestDetails.reason}</p>
        </div>
      )}

      {request.status !== "pending" && (
        <div className="rounded-lg bg-white/5 border border-white/10 p-4 mb-4">
          <p className="text-xs text-white/40 mb-2">
            Processed by {request.processedBy?.name} on{" "}
            {request.processedAt
              ? format(new Date(request.processedAt), "MMM dd, yyyy 'at' h:mm a")
              : "—"}
          </p>
          {request.adminNotes && (
            <div>
              <p className="text-sm font-semibold text-white mb-1">Admin Notes:</p>
              <p className="text-sm text-white/70">{request.adminNotes}</p>
            </div>
          )}
        </div>
      )}

      {request.status === "pending" && (
        <div className="space-y-3">
          <div>
            <button
              onClick={() => setShowNotes(!showNotes)}
              className="text-sm text-white/60 hover:text-white transition-colors"
            >
              {showNotes ? "- Hide" : "+ Add"} Admin Notes
            </button>
            {showNotes && (
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes for the customer (optional)..."
                rows={3}
                className="mt-2 w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2 text-sm text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
              />
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleProcess("approve")}
              disabled={processing}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              {processing ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Approve
            </button>
            <button
              onClick={() => handleProcess("reject")}
              disabled={processing}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {processing ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
