"use client";

import { useState } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatCents } from "@/lib/utils";

export function CheckoutForm() {
  const { items, subtotalCents, clearCart } = useCart();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  if (items.length === 0) {
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items,
          customerName: data.name,
          customerEmail: data.email,
          shippingAddress: {
            name: data.name,
            line1: data.line1,
            line2: data.line2 || "",
            city: data.city,
            state: data.state,
            postalCode: data.postalCode,
            country: "US",
          },
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Checkout failed");
      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
      } else if (json.orderNumber) {
        clearCart();
        window.location.href = `/order-success?order=${json.orderNumber}`;
      } else if (json.manual) {
        clearCart();
        window.location.href = `/order-success?order=${json.orderNumber}`;
      } else {
        throw new Error("No checkout URL returned. Please try again.");
      }
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const shippingCents = subtotalCents >= 5000 ? 0 : 599;
  const totalCents = subtotalCents + shippingCents;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input name="name" label="Full Name" required />
        <Input name="email" type="email" label="Email" required />
        <Input name="line1" label="Address Line 1" required className="sm:col-span-2" />
        <Input name="line2" label="Address Line 2" className="sm:col-span-2" />
        <Input name="city" label="City" required />
        <Input name="state" label="State" required />
        <Input name="postalCode" label="ZIP Code" required />
      </div>

      <div className="rounded-xl bg-explore-sand/50 p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCents(subtotalCents)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{shippingCents === 0 ? "Free" : formatCents(shippingCents)}</span>
        </div>
        <div className="flex justify-between font-bold text-base pt-2 border-t border-explore-charcoal/10">
          <span>Total</span>
          <span>{formatCents(totalCents)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" size="lg" disabled={status === "loading"} className="w-full">
        {status === "loading" ? "Processing..." : `Pay ${formatCents(totalCents)}`}
      </Button>
    </form>
  );
}
