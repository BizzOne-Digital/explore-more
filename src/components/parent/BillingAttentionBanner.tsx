import Link from "next/link";
import type { ParentBillingAlert } from "@/lib/billing/parent-billing-alert";

export function BillingAttentionBanner({ alert }: { alert: ParentBillingAlert }) {
  const tone =
    alert.kind === "past_due"
      ? "border-amber-300 bg-amber-50 text-amber-950"
      : "border-explore-teal/30 bg-explore-teal/10 text-explore-charcoal";

  return (
    <div className={`mb-6 rounded-xl border px-4 py-4 sm:px-5 ${tone}`}>
      <p className="text-sm font-semibold">{alert.title}</p>
      <p className="mt-1 text-sm opacity-90">{alert.message}</p>
      <Link
        href="/parent/billing"
        className="mt-3 inline-flex rounded-lg bg-explore-teal px-4 py-2 text-sm font-semibold text-white hover:bg-explore-teal/90"
      >
        Go to Billing &amp; Subscription
      </Link>
    </div>
  );
}
