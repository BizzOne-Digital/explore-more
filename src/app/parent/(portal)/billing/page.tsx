import { BillingClient } from "@/components/parent/BillingClient";

export default function ParentBillingPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Billing & Subscription</h2>
        <p className="mt-1 text-sm text-explore-charcoal/70">
          View and update your billing details, payment method, subscription plan, and payment
          history. Card numbers are never stored in full — only the card type and last four digits
          are shown.
        </p>
      </div>
      <BillingClient />
    </div>
  );
}
