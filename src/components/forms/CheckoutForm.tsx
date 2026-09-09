"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/providers/CartProvider";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatCents } from "@/lib/utils";
import { isBookCartItem } from "@/lib/cart/items";
import { cartRequiresShippingAddress } from "@/lib/orders/book-shipping";

type ShippingInfoMap = Record<string, { isDigital: boolean }>;

type ShippingOption = {
  id: string;
  carrier: string;
  service: string;
  rateCents: number;
  estimatedDays: number | null;
};

type CheckoutQuote = {
  subtotalCents: number;
  shippingCents: number;
  taxCents: number;
  taxRatePercent: number;
  taxJurisdiction: string;
  shippingOptions: ShippingOption[];
  selectedShippingOptionId: string | null;
  needsAddress: boolean;
  isFreeCart: boolean;
  totalCents: number;
  liveShippingRates: boolean;
};

export function CheckoutForm() {
  const { items, subtotalCents, clearCart } = useCart();
  const bookItems = items.filter(isBookCartItem);
  const bookIdsKey = bookItems.map((item) => item.bookId).join(",");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");
  const [donationDollars, setDonationDollars] = useState("");
  const [shippingInfo, setShippingInfo] = useState<ShippingInfoMap>({});
  const [address, setAddress] = useState({
    line1: "",
    line2: "",
    city: "",
    state: "",
    postalCode: "",
  });
  const [quote, setQuote] = useState<CheckoutQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [selectedShippingId, setSelectedShippingId] = useState<string | null>(null);

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
  const isFreeCart = quote?.isFreeCart ?? shippingLines.every((item) => item.priceCents === 0);
  const donationCents = Math.round(parseFloat(donationDollars || "0") * 100) || 0;

  const fetchQuote = useCallback(async () => {
    if (bookItems.length === 0) return;

    const hasAddress =
      !needsAddress ||
      (address.line1 && address.city && address.state && address.postalCode.length >= 5);

    if (needsAddress && !hasAddress) {
      setQuote(null);
      return;
    }

    setQuoteLoading(true);
    try {
      const res = await fetch("/api/checkout/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: bookItems.map((item) => ({
            bookId: item.bookId,
            quantity: item.quantity,
          })),
          shippingAddress: needsAddress
            ? {
                line1: address.line1,
                line2: address.line2,
                city: address.city,
                state: address.state,
                postalCode: address.postalCode,
                country: "US",
              }
            : undefined,
          shippingOptionId: selectedShippingId ?? undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load quote");

      setQuote(json);
      if (json.selectedShippingOptionId && json.selectedShippingOptionId !== selectedShippingId) {
        setSelectedShippingId(json.selectedShippingOptionId);
      }
    } catch {
      setQuote(null);
    } finally {
      setQuoteLoading(false);
    }
  }, [address, bookItems, needsAddress, selectedShippingId]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchQuote();
    }, 400);
    return () => clearTimeout(timer);
  }, [fetchQuote]);

  const shippingCents = quote?.shippingCents ?? 0;
  const taxCents = quote?.taxCents ?? 0;
  const displaySubtotal = quote?.subtotalCents ?? subtotalCents;
  const totalCents =
    displaySubtotal + shippingCents + taxCents + (isFreeCart ? donationCents : 0);

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

    if (needsAddress && (!address.line1 || !address.city || !address.state || !address.postalCode)) {
      setError("Please enter your full shipping address.");
      setStatus("error");
      return;
    }

    try {
      const payload: Record<string, unknown> = {
        items: bookItems,
        customerName: data.name,
        customerEmail: data.email,
        shippingOptionId: selectedShippingId ?? quote?.selectedShippingOptionId,
      };

      if (isFreeCart && donationCents > 0) {
        payload.donationCents = donationCents;
      }

      if (needsAddress) {
        payload.shippingAddress = {
          name: data.name,
          line1: address.line1,
          line2: address.line2 || "",
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
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

  const shippingOptions = quote?.shippingOptions ?? [];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <Input name="name" label="Full Name" required />
        <Input name="email" type="email" label="Email" required />
        {needsAddress && (
          <>
            <Input
              name="line1"
              label="Address Line 1"
              required
              className="sm:col-span-2"
              value={address.line1}
              onChange={(e) => setAddress((prev) => ({ ...prev, line1: e.target.value }))}
            />
            <Input
              name="line2"
              label="Address Line 2"
              className="sm:col-span-2"
              value={address.line2}
              onChange={(e) => setAddress((prev) => ({ ...prev, line2: e.target.value }))}
            />
            <Input
              name="city"
              label="City"
              required
              value={address.city}
              onChange={(e) => setAddress((prev) => ({ ...prev, city: e.target.value }))}
            />
            <Input
              name="state"
              label="State"
              required
              value={address.state}
              onChange={(e) => setAddress((prev) => ({ ...prev, state: e.target.value }))}
            />
            <Input
              name="postalCode"
              label="ZIP Code"
              required
              value={address.postalCode}
              onChange={(e) => setAddress((prev) => ({ ...prev, postalCode: e.target.value }))}
            />
          </>
        )}
      </div>

      {!needsAddress && (
        <p className="rounded-xl bg-explore-teal/10 px-4 py-3 text-sm text-explore-charcoal/80">
          Digital books are delivered by email — no shipping address needed.
        </p>
      )}

      {needsAddress && shippingOptions.length > 1 && (
        <div className="rounded-xl border border-explore-charcoal/10 bg-explore-sand/40 p-4 space-y-3">
          <p className="text-sm font-medium text-explore-charcoal">Shipping method</p>
          {quote?.liveShippingRates && (
            <p className="text-xs text-explore-charcoal/60">Live carrier rates for your address</p>
          )}
          {shippingOptions.map((option) => (
            <label
              key={option.id}
              className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-explore-charcoal/10 bg-white px-3 py-2.5"
            >
              <span className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="shippingOption"
                  checked={(selectedShippingId ?? quote?.selectedShippingOptionId) === option.id}
                  onChange={() => setSelectedShippingId(option.id)}
                />
                <span>
                  {option.carrier} — {option.service}
                  {option.estimatedDays != null && (
                    <span className="text-explore-charcoal/60">
                      {" "}
                      (~{option.estimatedDays} days)
                    </span>
                  )}
                </span>
              </span>
              <span className="text-sm font-medium">{formatCents(option.rateCents)}</span>
            </label>
          ))}
        </div>
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
          <span>{formatCents(displaySubtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>
            {quoteLoading && needsAddress
              ? "Calculating..."
              : shippingCents === 0
                ? "Free"
                : formatCents(shippingCents)}
          </span>
        </div>
        {taxCents > 0 && (
          <div className="flex justify-between">
            <span>
              Sales tax
              {quote?.taxJurisdiction ? ` (${quote.taxJurisdiction})` : ""}
              {quote?.taxRatePercent ? ` — ${quote.taxRatePercent}%` : ""}
            </span>
            <span>{formatCents(taxCents)}</span>
          </div>
        )}
        {needsAddress && taxCents === 0 && !quoteLoading && quote && displaySubtotal > 0 && (
          <div className="flex justify-between text-explore-charcoal/60">
            <span>Sales tax</span>
            <span>No tax for this order</span>
          </div>
        )}
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
      <Button type="submit" size="lg" disabled={status === "loading" || quoteLoading} className="w-full">
        {submitLabel}
      </Button>
    </form>
  );
}
