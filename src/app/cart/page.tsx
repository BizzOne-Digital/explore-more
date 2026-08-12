"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/providers/CartProvider";
import { Button } from "@/components/ui/Button";
import { formatCents } from "@/lib/utils";

export default function CartPage() {
  const { items, updateQuantity, removeItem, subtotalCents, itemCount } = useCart();

  if (items.length === 0) {
    return (
      <section className="flex min-h-[70vh] w-full items-center justify-center overflow-x-clip bg-explore-cream pt-28 pb-16">
        <div className="w-full min-w-0 max-w-md px-3 text-center sm:px-4">
          <ShoppingBag className="h-16 w-16 mx-auto text-explore-charcoal/20 mb-4" />
          <h1 className="font-display text-2xl font-bold text-explore-charcoal">Your cart is empty</h1>
          <p className="mt-2 text-sm text-explore-charcoal/60">Browse our bookstore to find your next adventure read.</p>
          <Button href="/books" variant="secondary" className="mt-6">Visit Bookstore</Button>
        </div>
      </section>
    );
  }

  return (
    <section className="w-full overflow-x-clip min-h-screen bg-explore-cream pt-28 pb-16">
      <div className="mx-auto w-full min-w-0 max-w-4xl px-3 sm:px-4">
        <h1 className="mb-8 font-display text-2xl font-bold text-explore-charcoal sm:text-3xl">
          Cart ({itemCount} {itemCount === 1 ? "item" : "items"})
        </h1>

        <div className="space-y-4">
          {items.map((item) => (
            <div
              key={item.bookId}
              className="flex flex-wrap gap-3 rounded-2xl border border-explore-charcoal/10 bg-white p-3 shadow-sm sm:gap-4 sm:p-4"
            >
              <div className="relative h-24 w-20 shrink-0 rounded-lg overflow-hidden bg-explore-sand">
                {item.coverImage ? (
                  <Image src={item.coverImage} alt={item.title} fill className="object-cover" sizes="80px" />
                ) : (
                  <div className="flex h-full items-center justify-center text-explore-charcoal/20">
                    <ShoppingBag className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <Link href={`/books/${item.slug}`} className="font-semibold text-explore-charcoal hover:text-explore-teal line-clamp-1">
                  {item.title}
                </Link>
                <p className="text-sm text-explore-charcoal/60 mt-0.5">{formatCents(item.priceCents)} each</p>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center rounded-lg border border-explore-charcoal/15">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.bookId, item.quantity - 1)}
                      className="p-1.5 hover:bg-explore-cream transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="px-3 text-sm font-medium">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.bookId, item.quantity + 1)}
                      className="p-1.5 hover:bg-explore-cream transition-colors"
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.bookId)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    aria-label="Remove item"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <p className="w-full shrink-0 text-right font-semibold text-explore-charcoal sm:ml-auto sm:w-auto">
                {formatCents(item.priceCents * item.quantity)}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl bg-white border border-explore-charcoal/10 p-6 shadow-sm">
          <div className="flex justify-between text-lg font-bold">
            <span>Subtotal</span>
            <span>{formatCents(subtotalCents)}</span>
          </div>
          <p className="mt-1 text-xs text-explore-charcoal/50">Shipping calculated at checkout</p>
          <Button href="/checkout" size="lg" className="w-full mt-6">
            Proceed to Checkout
          </Button>
        </div>
      </div>
    </section>
  );
}
