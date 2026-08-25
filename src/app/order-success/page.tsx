import type { Metadata } from "next";
import { Suspense } from "react";
import { Loader } from "lucide-react";
import { OrderSuccessClient } from "@/components/orders/OrderSuccessClient";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your order has been placed successfully.",
};

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <section className="flex min-h-[70vh] w-full items-center justify-center bg-explore-cream pt-28 pb-16">
          <Loader className="h-10 w-10 animate-spin text-explore-teal" />
        </section>
      }
    >
      <OrderSuccessClient />
    </Suspense>
  );
}
