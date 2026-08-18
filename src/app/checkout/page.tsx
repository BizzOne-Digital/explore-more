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
        <h1 className="mb-4 font-display text-2xl font-bold text-explore-charcoal sm:text-3xl">Checkout</h1>

        <div className="mb-6 rounded-2xl border border-explore-charcoal/10 bg-white p-4 shadow-sm sm:p-6">
          <p className="text-sm font-semibold text-explore-charcoal">How would you like to checkout?</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border-2 border-explore-teal bg-explore-teal/5 p-4">
              <p className="font-semibold text-explore-charcoal">Checkout as Guest</p>
              <p className="mt-1 text-xs text-explore-charcoal/70">
                Complete your bookstore order without creating an account.
              </p>
            </div>
            <Link
              href="/login?callbackUrl=/checkout"
              className="rounded-xl border border-explore-charcoal/10 p-4 transition hover:border-explore-teal hover:bg-explore-teal/5"
            >
              <p className="font-semibold text-explore-charcoal">Sign in to your account</p>
              <p className="mt-1 text-xs text-explore-charcoal/70">
                Use your parent or student login to track orders in your portal.
              </p>
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-explore-charcoal/10 bg-white p-4 shadow-sm sm:p-8">
          <h2 className="mb-4 text-lg font-semibold text-explore-charcoal">Guest checkout</h2>
          <CheckoutForm />
        </div>
      </div>
    </section>
  );
}
