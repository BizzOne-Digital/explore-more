"use client";

import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatCents } from "@/lib/utils";
import { isBookCartItem } from "@/lib/cart/items";
import {
  calculateBookShippingCents,
  cartIsFreeOnly,
  cartRequiresShippingAddress,
} from "@/lib/orders/book-shipping";

type ShippingInfoMap = Record<string, { isDigital: boolean }>;

export function CheckoutForm() {
  const { items, subtotalCents, clearCart } = useCart();
  const bookItems = items.filter(isBookCartItem);
  const bookIdsKey = bookItems.map((item) => item.bookId).join(",");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [donationDollars, setDonationDollars] = useState("");
  const [shippingInfo, setShippingInfo] = useState<ShippingInfoMap>({});

  useEffect(() => {
    if (!bookIdsKey) {
      setShippingInfo({});
      return;
    }

    const bookIds = bookIdsKey.split(",");
    fetch("/api/books/shipping-info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookIds }),
    })
      .then((res) => res.json())
      .then((json) => {
        if (json?.books) setShippingInfo(json.books);
      })
      .catch(() => {
        /* fall back to cart flags */
      });
  }, [bookIdsKey]);

  const shippingLines = useMemo(
    () =>
      bookItems.map((item) => ({
        priceCents: item.priceCents,
        quantity: item.quantity,
        isDigital: shippingInfo[item.bookId]?.isDigital ?? item.isDigital === true,
      })),
    [bookItems, shippingInfo]
  );

  const needsAddress = cartRequiresShippingAddress(shippingLines);
  const isFreeCart = cartIsFreeOnly(shippingLines);
  const shippingCents = calculateBookShippingCents(shippingLines);
  const donationCents = Math.round(parseFloat(donationDollars || "0") * 100) || 0;
  const totalCents = subtotalCents + shippingCents + (isFreeCart ? donationCents : 0);

  if (bookItems.length === 0) {
    return null;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    if (isFreeCart && donationCents > 0 && donationCents < 50) {
      setError("Donations must be at least $0.50, or leave the field blank.");
      setStatus("error");
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        items: bookItems,
        customerName: data.name,
        customerEmail: data.email,
      };

      if (isFreeCart && donationCents > 0) {
        payload.donationCents = donationCents;
      }

      if (needsAddress) {
        payload.shippingAddress = {
          name: data.name,
          line1: data.line1,
          line2: data.line2 || "",
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
          country: "US",
        };
      }

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Checkout failed");

      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
        return;
      }

      if (json.orderNumber) {
        clearCart();
        window.location.href = `/order-success?order=${json.orderNumber}`;
        return;
      }

      throw new Error("No checkout URL returned. Please try again.");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  const submitLabel =
    totalCents === 0
      ? "Complete Free Order"
      : status === "loading"
        ? "Processing..."
        : `Pay ${formatCents(totalCents)}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input name="name" label="Full Name" required />
        <Input name="email" type="email" label="Email" required />
        {needsAddress && (
          <>
            <Input name="line1" label="Address Line 1" required className="sm:col-span-2" />
            <Input name="line2" label="Address Line 2" className="sm:col-span-2" />
            <Input name="city" label="City" required />
            <Input name="state" label="State" required />
            <Input name="postalCode" label="ZIP Code" required />
          </>
        )}
      </div>

      {!needsAddress && (
        <p className="rounded-xl bg-explore-teal/10 px-4 py-3 text-sm text-explore-charcoal/80">
          Digital books are delivered by email — no shipping address needed.
        </p>
      )}

      {isFreeCart && (
        <div className="rounded-xl border border-explore-charcoal/10 bg-explore-sand/40 p-4">
          <label className="block text-sm font-medium text-explore-charcoal">
            Leave an optional donation
          </label>
          <p className="mt-1 text-xs text-explore-charcoal/60">
            Support Explore More Academy — completely optional and not required to get your free
            book.
          </p>
          <div className="relative mt-3 max-w-xs">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-explore-charcoal/50">
              $
            </span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={donationDollars}
              onChange={(e) => setDonationDollars(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-explore-charcoal/15 bg-white py-2.5 pl-7 pr-3 text-sm"
            />
          </div>
        </div>
      )}

      <div className="rounded-xl bg-explore-sand/50 p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{formatCents(subtotalCents)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>{shippingCents === 0 ? "Free" : formatCents(shippingCents)}</span>
        </div>
        {isFreeCart && donationCents > 0 && (
          <div className="flex justify-between">
            <span>Donation</span>
            <span>{formatCents(donationCents)}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base pt-2 border-t border-explore-charcoal/10">
          <span>Total</span>
          <span>{formatCents(totalCents)}</span>
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" size="lg" disabled={status === "loading"} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
