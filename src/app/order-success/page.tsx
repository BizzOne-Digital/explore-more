import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your order has been placed successfully.",
};

interface Props {
  searchParams: Promise<{ order?: string }>;
}

export default async function OrderSuccessPage({ searchParams }: Props) {
  const { order } = await searchParams;

  return (
    <section className="flex min-h-[70vh] w-full items-center justify-center overflow-x-clip bg-explore-cream pt-28 pb-16">
      <div className="w-full min-w-0 max-w-md px-3 text-center sm:px-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-explore-forest/15 mx-auto mb-6">
          <CheckCircle className="h-10 w-10 text-explore-forest" />
        </div>
        <h1 className="font-display text-3xl font-bold text-explore-charcoal">Thank You!</h1>
        <p className="mt-3 text-explore-charcoal/70">
          Your order has been received{order ? ` — confirmation #${order}` : ""}. You&apos;ll receive an email shortly.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <Button href="/books" variant="secondary">Continue Shopping</Button>
          <Button href="/" variant="outline">Back to Home</Button>
        </div>
      </div>
    </section>
  );
}
