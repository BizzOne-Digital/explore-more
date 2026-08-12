"use client";

import Link from "next/link";
import { useCart } from "@/components/providers/CartProvider";
import { CheckoutForm } from "@/components/forms/CheckoutForm";
import { Button } from "@/components/ui/Button";
import { ShoppingBag } from "lucide-react";

export default function CheckoutPage() {
  const { items } = useCart();

  if (items.length === 0) {
    return (
      <section className="flex min-h-[70vh] w-full items-center justify-center overflow-x-clip bg-explore-cream pt-28 pb-16">
        <div className="w-full min-w-0 max-w-md px-3 text-center sm:px-4">
          <ShoppingBag className="h-16 w-16 mx-auto text-explore-charcoal/20 mb-4" />
          <h1 className="font-display text-2xl font-bold">Nothing to checkout</h1>
          <Button href="/books" variant="secondary" className="mt-6">Browse Books</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen w-full overflow-x-clip bg-explore-cream pt-28 pb-16">
      <div className="mx-auto w-full min-w-0 max-w-2xl px-3 sm:px-4">
        <Link href="/cart" className="mb-4 inline-block text-sm text-explore-teal hover:underline">
          ← Back to cart
        </Link>
        <h1 className="mb-8 font-display text-2xl font-bold text-explore-charcoal sm:text-3xl">Checkout</h1>
        <div className="rounded-2xl border border-explore-charcoal/10 bg-white p-4 shadow-sm sm:p-8">
          <CheckoutForm />
        </div>
      </div>
    </section>
  );
}
