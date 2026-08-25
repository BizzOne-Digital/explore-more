"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/providers/CartProvider";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatCents } from "@/lib/utils";
import { isEventPackageCartItem } from "@/lib/cart/items";

export default function EventCheckoutPage() {
  const router = useRouter();
  const { items, clearEventPackages } = useCart();
  const eventItems = useMemo(() => items.filter(isEventPackageCartItem), [items]);
  const eventSlug = eventItems[0]?.eventSlug;
  const eventTitle = eventItems[0]?.eventTitle;
  const subtotalCents = eventItems.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);

  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState("");

  if (eventItems.length === 0) {
    return (
      <section className="flex min-h-[70vh] items-center justify-center bg-explore-cream pt-28 pb-16">
        <div className="text-center">
          <p className="text-explore-charcoal/70">No event packages in your cart.</p>
          <Button href="/events" className="mt-4">Browse Events</Button>
        </div>
      </section>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch("/api/checkout/event-packages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventSlug,
          items: eventItems.map((item) => ({
            packageId: item.packageId,
            quantity: item.quantity,
          })),
          studentName: data.studentName,
          studentAge: data.studentAge ? Number(data.studentAge) : undefined,
          guardianName: data.guardianName,
          guardianEmail: data.guardianEmail,
          guardianPhone: data.guardianPhone,
          consentGiven: data.consentGiven === "on",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Checkout failed");

      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
        return;
      }

      clearEventPackages(eventItems[0]?.eventId);
      router.push(
        `/events/${eventSlug}?registered=true&confirmation=${encodeURIComponent(json.registrationId ?? "")}`
      );
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  return (
    <section className="w-full overflow-x-clip min-h-screen bg-explore-cream pt-28 pb-16">
      <div className="mx-auto w-full min-w-0 max-w-2xl px-3 sm:px-4">
        <h1 className="font-display text-3xl font-bold text-explore-charcoal">Event Checkout</h1>
        <p className="mt-2 text-sm text-explore-charcoal/70">{eventTitle}</p>

        <div className="mt-6 rounded-2xl border border-explore-charcoal/10 bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-explore-charcoal">Your selections</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {eventItems.map((item) => (
              <li key={`${item.packageId}-${item.title}`} className="flex justify-between gap-4">
                <span>
                  {item.title} × {item.quantity}
                </span>
                <span className="font-medium">{formatCents(item.priceCents * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex justify-between border-t border-explore-charcoal/10 pt-4 font-bold">
            <span>Total</span>
            <span>{formatCents(subtotalCents)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <Input name="studentName" label="Student Name" required />
          <Input name="studentAge" type="number" label="Student Age" />
          <Input name="guardianName" label="Parent/Guardian Name" required />
          <Input name="guardianEmail" type="email" label="Email" required />
          <Input name="guardianPhone" type="tel" label="Phone" required />
          <label className="flex items-start gap-3 text-sm text-explore-charcoal/80">
            <input type="checkbox" name="consentGiven" required className="mt-1" />
            <span>I agree to the event terms and consent to this registration.</span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <Button type="submit" size="lg" disabled={status === "loading"} className="w-full">
            {status === "loading"
              ? "Processing..."
              : subtotalCents === 0
                ? "Complete Registration"
                : `Pay ${formatCents(subtotalCents)}`}
          </Button>
        </form>
      </div>
    </section>
  );
}
