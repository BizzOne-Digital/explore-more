"use client";

import { useEffect, useState } from "react";
import { CreditCard, ExternalLink, Loader, Save } from "lucide-react";
import { formatCents } from "@/lib/utils";
import {
  formatInterval,
  formatPaymentMethod,
  formatSubscriptionStatus,
} from "@/lib/billing/format";

type BillingData = {
  billing: {
    billingName: string;
    billingEmail: string;
    billingPhone?: string;
    billingAddress: { street?: string; city?: string; state?: string; zip?: string };
  };
  paymentMethod: { brand: string; last4: string; expMonth?: number; expYear?: number } | null;
  subscription: {
    status: string;
    planId?: string;
    planName: string;
    priceCents: number;
    interval: "month" | "year";
    features: string[];
    description?: string;
    currentPeriodEnd?: string;
    cancelAtPeriodEnd: boolean;
    discountPercent: number;
    creditCents: number;
    stripeSubscriptionId?: string;
  };
  paymentHistory: {
    id: string;
    date: string;
    description: string;
    amountCents: number;
    status: string;
    type: string;
    reference?: string;
  }[];
  stripeConfigured: boolean;
  plans?: Array<{
    _id: string;
    name: string;
    priceCents: number;
    interval: "month" | "year";
    features: string[];
    description?: string;
  }>;
  canManageSubscription?: boolean;
};

export function BillingClient() {
  const [data, setData] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [planChangingId, setPlanChangingId] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    billingName: "",
    billingEmail: "",
    billingPhone: "",
    street: "",
    city: "",
    state: "",
    zip: "",
  });

  async function load() {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/parent/billing");
      const json = await res.json().catch(() => null);
      if (!json?.success) {
        setError(json?.error || "Failed to load billing information");
        setData(null);
        return;
      }
      setData(json.data);
      const b = json.data.billing;
      setForm({
        billingName: b.billingName ?? "",
        billingEmail: b.billingEmail ?? "",
        billingPhone: b.billingPhone ?? "",
        street: b.billingAddress?.street ?? "",
        city: b.billingAddress?.city ?? "",
        state: b.billingAddress?.state ?? "",
        zip: b.billingAddress?.zip ?? "",
      });
    } catch {
      setError("Failed to load billing. Please refresh and try again.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/parent/billing");
        const json = await res.json().catch(() => null);
        if (cancelled) return;
        if (!json?.success) {
          const msg =
            res.status === 403
              ? "This page requires a parent account. Please sign out and sign in at /parent/login with your parent email."
              : json?.error || "Failed to load billing information";
          setError(msg);
          setData(null);
          return;
        }
        setData(json.data);
        const b = json.data.billing;
        setForm({
          billingName: b.billingName ?? "",
          billingEmail: b.billingEmail ?? "",
          billingPhone: b.billingPhone ?? "",
          street: b.billingAddress?.street ?? "",
          city: b.billingAddress?.city ?? "",
          state: b.billingAddress?.state ?? "",
          zip: b.billingAddress?.zip ?? "",
        });
      } catch {
        if (!cancelled) {
          setError("Failed to load billing. Please refresh and try again.");
          setData(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/parent/billing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          billingName: form.billingName,
          billingEmail: form.billingEmail,
          billingPhone: form.billingPhone,
          billingAddress: {
            street: form.street,
            city: form.city,
            state: form.state,
            zip: form.zip,
          },
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Failed to save");
        return;
      }
      setSuccess("Billing information updated.");
      setData((prev) => ({
        ...json.data,
        plans: json.data.plans ?? prev?.plans ?? [],
        canManageSubscription:
          json.data.canManageSubscription ?? prev?.canManageSubscription ?? false,
      }));
      const b = json.data.billing;
      setForm({
        billingName: b.billingName ?? "",
        billingEmail: b.billingEmail ?? "",
        billingPhone: b.billingPhone ?? "",
        street: b.billingAddress?.street ?? "",
        city: b.billingAddress?.city ?? "",
        state: b.billingAddress?.state ?? "",
        zip: b.billingAddress?.zip ?? "",
      });
    } catch {
      setError("Failed to save billing information");
    } finally {
      setSaving(false);
    }
  }

  async function openBillingPortal(flow: "payment_method" | "subscription_manage" | "subscription_cancel") {
    setPortalLoading(true);
    setError("");
    try {
      const res = await fetch("/api/parent/billing/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flow }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Unable to open billing portal");
        return;
      }
      window.location.href = json.data.url;
    } catch {
      setError("Unable to open billing portal");
    } finally {
      setPortalLoading(false);
    }
  }

  async function changePlan(planId: string) {
    setPlanChangingId(planId);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/parent/billing/change-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Unable to change plan");
        return;
      }
      setData(json.data);
      setSuccess(`Your plan has been updated to ${json.data.changeResult?.planName ?? "the selected plan"}.`);
    } catch {
      setError("Unable to change plan. Please try again.");
    } finally {
      setPlanChangingId(null);
    }
  }

  async function handleCancelAction(action: "cancel" | "resume") {
    const confirmMessage =
      action === "cancel"
        ? "Cancel your subscription at the end of the current billing period? You will keep access until then."
        : "Keep your subscription active and remove the scheduled cancellation?";

    if (!window.confirm(confirmMessage)) return;

    setCancelLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/parent/billing/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, atPeriodEnd: true }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error || "Unable to update subscription");
        return;
      }
      setData(json.data);
      setSuccess(
        action === "cancel"
          ? "Your subscription is scheduled to cancel at the end of the current billing period."
          : "Your subscription will remain active."
      );
    } catch {
      setError("Unable to update subscription. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-explore-charcoal/60">
        <Loader className="mr-2 h-5 w-5 animate-spin" />
        Loading billing…
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-6 text-center">
        <p className="text-red-700">{error || "Unable to load billing."}</p>
        {error?.toLowerCase().includes("parent account") && (
          <a
            href="/parent/login?callbackUrl=/parent/billing"
            className="mt-3 inline-block rounded-lg bg-explore-teal px-4 py-2 text-sm text-white"
          >
            Go to parent login
          </a>
        )}
        {!error?.toLowerCase().includes("parent account") && (
          <button
            type="button"
            onClick={load}
            className="mt-3 rounded-lg bg-explore-teal px-4 py-2 text-sm text-white"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  const billing = data;
  const sub = billing.subscription;
  const hasActiveMembership = ["active", "trialing", "past_due"].includes(sub.status);
  const canManageSubscription =
    billing.canManageSubscription ??
    (billing.stripeConfigured &&
      !!sub.stripeSubscriptionId &&
      hasActiveMembership);
  const renewalDate = sub.currentPeriodEnd
    ? new Date(sub.currentPeriodEnd).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="font-display text-lg font-semibold">Current Subscription</h3>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-explore-charcoal/60">Plan</span>
              <span className="font-medium">{sub.planName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-explore-charcoal/60">Price</span>
              <span className="font-medium">
                {sub.priceCents > 0
                  ? `${formatCents(sub.priceCents)} / ${formatInterval(sub.interval).toLowerCase()}`
                  : "—"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-explore-charcoal/60">Status</span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  sub.status === "active"
                    ? "bg-green-100 text-green-800"
                    : sub.status === "past_due"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-700"
                }`}
              >
                {formatSubscriptionStatus(sub.status)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-explore-charcoal/60">Next billing date</span>
              <span className="font-medium">{renewalDate}</span>
            </div>
            {sub.cancelAtPeriodEnd && (
              <p className="text-xs text-amber-700">Cancels at end of current period.</p>
            )}
            {sub.discountPercent > 0 && (
              <div className="flex justify-between">
                <span className="text-explore-charcoal/60">Discount</span>
                <span className="font-medium">{sub.discountPercent}%</span>
              </div>
            )}
            {sub.creditCents > 0 && (
              <div className="flex justify-between">
                <span className="text-explore-charcoal/60">Account credit</span>
                <span className="font-medium">{formatCents(sub.creditCents)}</span>
              </div>
            )}
          </div>

          <div className="mt-6 border-t border-explore-charcoal/10 pt-4">
            <h4 className="text-sm font-semibold text-explore-charcoal">Manage subscription</h4>
            <p className="mt-1 text-xs text-explore-charcoal/60">
              Upgrade, downgrade, or cancel your membership plan.
            </p>

            {canManageSubscription ? (
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => openBillingPortal("subscription_manage")}
                  disabled={portalLoading}
                  className="w-full rounded-lg bg-explore-teal px-4 py-2.5 text-sm font-semibold text-white hover:bg-explore-teal/90 disabled:opacity-50"
                >
                  {portalLoading ? "Opening…" : "Manage subscription (upgrade or downgrade)"}
                </button>
                {sub.cancelAtPeriodEnd ? (
                  <button
                    type="button"
                    onClick={() => handleCancelAction("resume")}
                    disabled={cancelLoading}
                    className="w-full rounded-lg border border-green-600 px-4 py-2 text-sm font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
                  >
                    {cancelLoading ? "Updating…" : "Keep my subscription active"}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleCancelAction("cancel")}
                    disabled={cancelLoading}
                    className="w-full rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
                  >
                    {cancelLoading ? "Updating…" : "Cancel subscription"}
                  </button>
                )}
              </div>
            ) : billing.stripeConfigured && hasActiveMembership ? (
              <div className="mt-3 space-y-2">
                <button
                  type="button"
                  onClick={() => openBillingPortal("subscription_manage")}
                  disabled={portalLoading}
                  className="w-full rounded-lg border border-explore-teal px-4 py-2 text-sm font-medium text-explore-teal hover:bg-explore-teal/5 disabled:opacity-50"
                >
                  {portalLoading ? "Opening…" : "Open billing portal"}
                </button>
                <p className="text-xs text-explore-charcoal/55">
                  If cancel or plan change options do not appear, contact Explore More Academy and
                  we can help link your Stripe subscription.
                </p>
              </div>
            ) : billing.stripeConfigured && sub.status === "none" ? (
              <a
                href="/membership"
                className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-explore-teal px-4 py-2 text-sm font-medium text-white hover:bg-explore-teal/90"
              >
                View membership plans
              </a>
            ) : (
              <p className="mt-3 text-xs text-explore-charcoal/55">
                Online subscription management is not available for this account. Please contact
                Explore More Academy for billing help.
              </p>
            )}
          </div>

          {sub.features.length > 0 && (
            <div className="mt-4 border-t border-explore-charcoal/10 pt-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-explore-charcoal/50">
                Included
              </p>
              <ul className="mt-2 list-inside list-disc text-sm text-explore-charcoal/80">
                {sub.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <section className="rounded-xl bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-display text-lg font-semibold">Payment Method</h3>
              <p className="mt-2 flex items-center gap-2 text-sm">
                <CreditCard className="h-4 w-4 text-explore-teal" />
                {formatPaymentMethod(billing.paymentMethod)}
              </p>
              {billing.paymentMethod?.expMonth && billing.paymentMethod?.expYear && (
                <p className="mt-1 text-xs text-explore-charcoal/50">
                  Expires {billing.paymentMethod.expMonth}/{billing.paymentMethod.expYear}
                </p>
              )}
            </div>
          </div>
          {billing.stripeConfigured ? (
            <button
              type="button"
              onClick={() => openBillingPortal("payment_method")}
              disabled={portalLoading}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-explore-teal px-4 py-2 text-sm font-medium text-white hover:bg-explore-teal/90 disabled:opacity-50"
            >
              {portalLoading ? (
                <Loader className="h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="h-4 w-4" />
              )}
              Update payment method
            </button>
          ) : (
            <p className="mt-4 text-xs text-explore-charcoal/60">
              Online card updates are managed by Explore More Academy staff. Contact us to change
              your payment method.
            </p>
          )}
        </section>
      </div>

      {billing.plans && billing.plans.length > 0 && (
        <section className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="font-display text-lg font-semibold">Available Plans</h3>
          <p className="mt-1 text-sm text-explore-charcoal/60">
            {canManageSubscription
              ? "Select a plan below to upgrade or downgrade. Prorated charges or credits may apply."
              : hasActiveMembership
                ? "Use Manage subscription above to change plans in Stripe, or contact the academy for help."
                : "Subscribe from the membership page to get started, then return here to manage your plan."}
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {billing.plans.map((plan) => {
              const isCurrent = sub.planId === plan._id || sub.planName === plan.name;
              return (
                <div
                  key={plan._id}
                  className={`rounded-lg border p-4 ${
                    isCurrent
                      ? "border-explore-teal bg-explore-teal/5"
                      : "border-explore-charcoal/15"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{plan.name}</p>
                      <p className="text-sm text-explore-charcoal/70">
                        {formatCents(plan.priceCents)} / {formatInterval(plan.interval).toLowerCase()}
                      </p>
                    </div>
                    {isCurrent && (
                      <span className="rounded-full bg-explore-teal px-2 py-0.5 text-xs font-semibold text-white">
                        Current
                      </span>
                    )}
                  </div>
                  {plan.features?.length > 0 && (
                    <ul className="mt-3 list-inside list-disc text-xs text-explore-charcoal/70">
                      {plan.features.slice(0, 4).map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                  )}
                  {canManageSubscription && !isCurrent && (
                    <button
                      type="button"
                      onClick={() => changePlan(plan._id)}
                      disabled={planChangingId === plan._id}
                      className="mt-4 w-full rounded-lg bg-explore-charcoal px-4 py-2 text-sm font-medium text-white hover:bg-explore-charcoal/90 disabled:opacity-50"
                    >
                      {planChangingId === plan._id ? "Switching plan…" : "Switch to this plan"}
                    </button>
                  )}
                  {!canManageSubscription && !isCurrent && (
                    <a
                      href="/membership"
                      className="mt-4 inline-flex w-full items-center justify-center rounded-lg border border-explore-teal px-4 py-2 text-sm font-medium text-explore-teal hover:bg-explore-teal/5"
                    >
                      Subscribe
                    </a>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="rounded-xl bg-white p-6 shadow-sm">
        <h3 className="font-display text-lg font-semibold">Billing Information</h3>
        <form onSubmit={handleSave} className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium text-explore-charcoal/70">
              Billing name
            </label>
            <input
              value={form.billingName}
              onChange={(e) => setForm({ ...form, billingName: e.target.value })}
              className="w-full rounded-lg border border-explore-charcoal/15 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-explore-charcoal/70">Email</label>
            <input
              type="email"
              value={form.billingEmail}
              onChange={(e) => setForm({ ...form, billingEmail: e.target.value })}
              className="w-full rounded-lg border border-explore-charcoal/15 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-explore-charcoal/70">Phone</label>
            <input
              value={form.billingPhone}
              onChange={(e) => setForm({ ...form, billingPhone: e.target.value })}
              className="w-full rounded-lg border border-explore-charcoal/15 px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-1 block text-xs font-medium text-explore-charcoal/70">
              Street address
            </label>
            <input
              value={form.street}
              onChange={(e) => setForm({ ...form, street: e.target.value })}
              className="w-full rounded-lg border border-explore-charcoal/15 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-explore-charcoal/70">City</label>
            <input
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full rounded-lg border border-explore-charcoal/15 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-explore-charcoal/70">State</label>
            <input
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="w-full rounded-lg border border-explore-charcoal/15 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-explore-charcoal/70">
              ZIP code
            </label>
            <input
              value={form.zip}
              onChange={(e) => setForm({ ...form, zip: e.target.value })}
              className="w-full rounded-lg border border-explore-charcoal/15 px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-lg bg-explore-charcoal px-4 py-2 text-sm font-medium text-white hover:bg-explore-charcoal/90 disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Saving…" : "Save billing info"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl bg-white shadow-sm overflow-hidden">
        <div className="border-b border-explore-charcoal/10 px-6 py-4">
          <h3 className="font-display text-lg font-semibold">Payment History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-explore-sand text-left">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Reference</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {billing.paymentHistory.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-explore-charcoal/50">
                    No payments yet.
                  </td>
                </tr>
              ) : (
                billing.paymentHistory.map((p) => (
                  <tr key={`${p.type}-${p.id}`} className="border-t border-explore-charcoal/8">
                    <td className="px-4 py-3">
                      {new Date(p.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3">{p.description}</td>
                    <td className="px-4 py-3 font-mono text-xs">{p.reference ?? "—"}</td>
                    <td className="px-4 py-3 font-semibold">{formatCents(p.amountCents)}</td>
                    <td className="px-4 py-3 capitalize">{p.status}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
