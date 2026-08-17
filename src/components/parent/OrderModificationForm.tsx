"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";

interface OrderModificationFormProps {
  orderId: string;
  orderNumber: string;
  onClose: () => void;
  onSuccess: () => void;
}

export function OrderModificationForm({
  orderId,
  orderNumber,
  onClose,
  onSuccess,
}: OrderModificationFormProps) {
  const [requestType, setRequestType] = useState<string>("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/parent/order-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          requestType,
          requestDetails: { reason },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit request");
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit request");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-explore-charcoal/10">
          <div>
            <h2 className="font-display text-2xl font-bold text-explore-charcoal">
              Modify Order
            </h2>
            <p className="text-sm text-explore-charcoal/60 mt-1">
              Order #{orderNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-explore-sand rounded-lg transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Request Type */}
          <div>
            <label className="block text-sm font-medium text-explore-charcoal mb-2">
              What would you like to do? *
            </label>
            <select
              value={requestType}
              onChange={(e) => setRequestType(e.target.value)}
              required
              className="w-full rounded-lg border border-explore-charcoal/20 bg-white px-4 py-3 text-explore-charcoal focus:border-explore-teal focus:outline-none focus:ring-2 focus:ring-explore-teal/20"
            >
              <option value="">Select an option</option>
              <option value="add_item">Add Item(s) to Order</option>
              <option value="remove_item">Remove Item(s) from Order</option>
              <option value="change_address">Change Shipping Address</option>
              <option value="cancel_order">Cancel Order</option>
            </select>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-explore-charcoal mb-2">
              Reason / Details *
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              rows={4}
              placeholder="Please explain what you need changed and why..."
              className="w-full rounded-lg border border-explore-charcoal/20 bg-white px-4 py-3 text-explore-charcoal focus:border-explore-teal focus:outline-none focus:ring-2 focus:ring-explore-teal/20"
            />
          </div>

          {/* Info Box */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Your request will be reviewed by our admin team. 
              You will receive an email notification once it&apos;s processed.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-explore-charcoal/20 px-4 py-3 text-sm font-semibold text-explore-charcoal hover:bg-explore-sand transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-explore-teal px-4 py-3 text-sm font-semibold text-white hover:bg-explore-teal/90 transition-colors disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
