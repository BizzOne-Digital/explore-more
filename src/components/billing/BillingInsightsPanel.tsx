import {
  formatInvoiceStatus,
  formatPaymentMethod,
  formatSubscriptionStatus,
  subscriptionStatusBadgeClass,
  subscriptionStatusBadgeClassLight,
} from "@/lib/billing/format";
import type { StripeBillingInsights } from "@/lib/billing/stripe-billing-insights";
import type { IPaymentMethodSnapshot } from "@/models/Billing";
import { CopyIdButton } from "@/components/parent/CopyIdButton";

function formatCents(cents: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);
}

export function BillingInsightsPanel({
  insights,
  paymentMethod,
  variant = "dark",
}: {
  insights: StripeBillingInsights;
  paymentMethod: IPaymentMethodSnapshot | null;
  variant?: "dark" | "light";
}) {
  const badgeClass =
    variant === "dark"
      ? subscriptionStatusBadgeClass(insights.stripeStatus)
      : subscriptionStatusBadgeClassLight(insights.stripeStatus);

  const boxClass =
    variant === "dark"
      ? "rounded-lg border border-white/10 bg-black/20 p-4 text-sm"
      : "rounded-lg border border-explore-charcoal/10 bg-explore-charcoal/5 p-4 text-sm";

  const labelClass = variant === "dark" ? "text-white/50" : "text-explore-charcoal/50";
  const valueClass = variant === "dark" ? "text-white" : "text-explore-charcoal";

  return (
    <div className={boxClass}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-wide ${labelClass}`}>
            Billing status (Stripe)
          </p>
          <p className={`mt-2 font-semibold ${valueClass}`}>{insights.statusLabel}</p>
          <span className={`mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass}`}>
            {formatSubscriptionStatus(insights.stripeStatus)}
          </span>
        </div>
      </div>

      <dl className={`mt-3 grid gap-2 sm:grid-cols-1 ${valueClass}`}>
        <div>
          <dt className={`text-xs ${labelClass}`}>Stripe customer ID</dt>
          <dd className="mt-0.5 flex items-center gap-2 font-mono text-xs">
            {insights.stripeCustomerId ?? "— (not linked yet)"}
            {insights.stripeCustomerId ? (
              <CopyIdButton
                value={insights.stripeCustomerId}
                label=""
                variant={variant === "dark" ? "dark" : "light"}
              />
            ) : null}
          </dd>
        </div>
        <div>
          <dt className={`text-xs ${labelClass}`}>Stripe subscription ID</dt>
          <dd className="mt-0.5 flex items-center gap-2 font-mono text-xs">
            {insights.stripeSubscriptionId ?? "— (no subscription — renewals will not run)"}
            {insights.stripeSubscriptionId ? (
              <CopyIdButton
                value={insights.stripeSubscriptionId}
                label=""
                variant={variant === "dark" ? "dark" : "light"}
              />
            ) : null}
          </dd>
        </div>
      </dl>

      <p className={`mt-3 ${variant === "dark" ? "text-white/70" : "text-explore-charcoal/70"}`}>
        {insights.statusDetail}
      </p>

      <dl className={`mt-4 grid gap-2 sm:grid-cols-2 ${valueClass}`}>
        <div>
          <dt className={`text-xs ${labelClass}`}>Academy record status</dt>
          <dd className="font-medium">{formatSubscriptionStatus(insights.portalStatus)}</dd>
        </div>
        <div>
          <dt className={`text-xs ${labelClass}`}>Card on file (Stripe)</dt>
          <dd className="font-medium">{formatPaymentMethod(paymentMethod)}</dd>
        </div>
        <div>
          <dt className={`text-xs ${labelClass}`}>Latest invoice</dt>
          <dd className="font-medium">
            {formatInvoiceStatus(insights.latestInvoiceStatus)}
            {insights.latestInvoiceAmountDueCents != null &&
              insights.latestInvoiceStatus !== "paid" &&
              ` · ${formatCents(insights.latestInvoiceAmountDueCents)}`}
          </dd>
        </div>
        <div>
          <dt className={`text-xs ${labelClass}`}>Stripe renewal date</dt>
          <dd className="font-medium">
            {insights.stripePeriodEnd
              ? new Date(insights.stripePeriodEnd).toLocaleDateString("en-US")
              : "—"}
          </dd>
        </div>
      </dl>

      {insights.lastPaymentError && (
        <p className="mt-3 text-xs text-red-400">Decline / error: {insights.lastPaymentError}</p>
      )}

      <p className={`mt-4 text-xs ${labelClass}`}>{insights.externalPaymentsNote}</p>
    </div>
  );
}
