"use client";

import { useState } from "react";
import { Edit3 } from "lucide-react";
import { OrderModificationForm } from "./OrderModificationForm";

interface OrderModificationButtonProps {
  orderId: string;
  orderNumber: string;
}

export function OrderModificationButton({
  orderId,
  orderNumber,
}: OrderModificationButtonProps) {
  const [showForm, setShowForm] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowForm(true)}
        className="inline-flex items-center gap-1 text-sm text-explore-teal hover:underline"
      >
        <Edit3 className="h-3 w-3" />
        Modify
      </button>

      {showForm && (
        <OrderModificationForm
          orderId={orderId}
          orderNumber={orderNumber}
          onClose={() => setShowForm(false)}
          onSuccess={() => {
            alert("Request submitted! Admin will review it soon.");
            window.location.reload();
          }}
        />
      )}
    </>
  );
}
