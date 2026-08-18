"use client";

import { useState } from "react";
import { Check, Loader, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { formatCents } from "@/lib/utils";
import {
  MEMBERSHIP_TIERS,
  annualSavingsMonths,
  getTierPriceCents,
  membershipPlanSlug,
  type BillingInterval,
} from "@/lib/membership/plans";

export function MembershipPlans() {
  const [interval, setInterval] = useState<BillingInterval>("month");
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function handleCheckout(tierId: string) {
    const slug = membershipPlanSlug(tierId as (typeof MEMBERSHIP_TIERS)[number]["id"], interval);
    setLoadingSlug(slug);
    setError("");

    try {
      const res = await fetch("/api/checkout/membership", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planSlug: slug }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          json.error ||
            (res.status === 503
              ? "Online checkout is not available yet. Please contact the academy."
              : "Checkout failed")
        );
      }
      if (json.url) {
        globalThis.location.assign(json.url);
        return;
      }
      throw new Error("No checkout URL returned");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoadingSlug(null);
    }
  }

  return (
    <div className="space-y-10">
      <div className="rounded-2xl border border-explore-teal/20 bg-gradient-to-br from-explore-teal/10 to-explore-orange/5 p-6 text-center sm:p-8">
        <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-explore-teal">
          <Sparkles className="h-4 w-4" />
          Annual Savings Option
        </p>
        <h2 className="mt-2 font-display text-2xl font-bold text-explore-charcoal sm:text-3xl">
          Pay annually and receive 2 months FREE
        </h2>
        <p className="mt-2 text-sm text-explore-charcoal/70">
          Switch billing below to compare monthly and annual pricing.
        </p>

        <div className="mt-6 inline-flex rounded-full border border-explore-charcoal/10 bg-white p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setInterval("month")}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              interval === "month"
                ? "bg-explore-teal text-white shadow"
                : "text-explore-charcoal/70 hover:text-explore-charcoal"
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setInterval("year")}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition ${
              interval === "year"
                ? "bg-explore-teal text-white shadow"
                : "text-explore-charcoal/70 hover:text-explore-charcoal"
            }`}
          >
            Annually
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        {MEMBERSHIP_TIERS.map((tier) => {
          const slug = membershipPlanSlug(tier.id, interval);
          const priceCents = getTierPriceCents(tier, interval);
          const savingsMonths = annualSavingsMonths(tier);
          const isLoading = loadingSlug === slug;

          return (
            <article
              key={tier.id}
              className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
                tier.popular
                  ? "border-explore-orange ring-2 ring-explore-orange/30"
                  : "border-explore-charcoal/10"
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-explore-orange px-3 py-1 text-xs font-bold uppercase tracking-wide text-white">
                  Most Popular
                </span>
              )}

              <div className="mb-4">
                <p className="text-3xl">{tier.emoji}</p>
                <h3 className="mt-2 font-display text-xl font-bold text-explore-charcoal">
                  {tier.name}
                </h3>
                <p className="mt-1 text-sm text-explore-charcoal/70">{tier.tagline}</p>
              </div>

              <div className="mb-5">
                <p className="font-display text-3xl font-bold text-explore-teal">
                  {formatCents(priceCents)}
                  <span className="text-base font-medium text-explore-charcoal/60">
                    {interval === "month" ? " / month" : " / year"}
                  </span>
                </p>
                {interval === "year" && savingsMonths > 0 && (
                  <p className="mt-1 text-xs font-semibold text-explore-orange">
                    Save {savingsMonths} month{savingsMonths === 1 ? "" : "s"} vs monthly billing
                  </p>
                )}
              </div>

              <div className="flex-1">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-explore-charcoal/50">
                  Includes
                </p>
                <ul className="space-y-2">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex gap-2 text-sm text-explore-charcoal/80">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-explore-teal" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <p className="mt-5 rounded-lg bg-explore-sand/50 px-3 py-2 text-xs text-explore-charcoal/70">
                <strong>Best for:</strong> {tier.bestFor}
              </p>

              <Button
                type="button"
                variant={tier.popular ? "primary" : "secondary"}
                size="lg"
                className="mt-5 w-full"
                disabled={isLoading}
                onClick={() => void handleCheckout(tier.id)}
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader className="h-4 w-4 animate-spin" />
                    Redirecting…
                  </span>
                ) : (
                  `Choose ${tier.name.replace(" Membership", "")}`
                )}
              </Button>
            </article>
          );
        })}
      </div>

      <div className="overflow-x-auto rounded-2xl border border-explore-charcoal/10 bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-explore-charcoal/10 bg-explore-sand/40">
            <tr>
              <th className="px-4 py-3 font-semibold text-explore-charcoal">Membership</th>
              <th className="px-4 py-3 font-semibold text-explore-charcoal">Monthly</th>
              <th className="px-4 py-3 font-semibold text-explore-charcoal">Annual</th>
            </tr>
          </thead>
          <tbody>
            {MEMBERSHIP_TIERS.map((tier) => (
              <tr key={tier.id} className="border-b border-explore-charcoal/5 last:border-0">
                <td className="px-4 py-3 font-medium">
                  {tier.emoji} {tier.name.replace(" Membership", "")}
                </td>
                <td className="px-4 py-3">{formatCents(tier.monthlyPriceCents)}</td>
                <td className="px-4 py-3">{formatCents(tier.annualPriceCents)}/year</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
