import { ParentSubscription } from "@/models";
import { getStripe } from "@/lib/services/stripe";
import { ensureStripeSubscriptionLinked } from "./subscription-management";
import { getStripeBillingInsights } from "./stripe-billing-insights";

export type ParentBillingAlert =
  | {
      kind: "past_due";
      title: string;
      message: string;
    }
  | {
      kind: "setup_stripe";
      title: string;
      message: string;
      planSlug?: string;
    }
  | {
      kind: "update_payment";
      title: string;
      message: string;
    };

export async function getParentBillingAlert(userId: string): Promise<ParentBillingAlert | null> {
  if (!getStripe()) return null;

  await ensureStripeSubscriptionLinked(userId);

  const [subscription, insights] = await Promise.all([
    ParentSubscription.findOne({ userId }).populate("planId").lean(),
    getStripeBillingInsights(userId),
  ]);

  const planSlug =
    subscription?.planId &&
    typeof subscription.planId === "object" &&
    "slug" in subscription.planId
      ? (subscription.planId as { slug?: string }).slug
      : undefined;

  const portalStatus = subscription?.status ?? "none";
  const hasPaidPlan =
    !!planSlug || ["active", "trialing", "past_due", "paused"].includes(portalStatus);

  if (
    insights.stripeStatus === "past_due" ||
    portalStatus === "past_due" ||
    insights.latestInvoiceStatus === "open"
  ) {
    return {
      kind: "past_due",
      title: "Payment required",
      message:
        "Your membership renewal did not go through. Open Billing & Subscription to update your card or complete payment.",
    };
  }

  if (hasPaidPlan && !insights.stripeSubscriptionId) {
    return {
      kind: "setup_stripe",
      title: "Complete your membership billing",
      message:
        "Your account is active in our system, but automatic billing is not set up yet. Open Billing & Subscription to add your card and start Stripe auto-pay.",
      planSlug,
    };
  }

  if (insights.stripeSubscriptionId && !insights.paymentMethodOnFile) {
    return {
      kind: "update_payment",
      title: "Add a payment method",
      message:
        "Add a card on file so your membership can renew automatically. Go to Billing & Subscription → Update payment method.",
    };
  }

  return null;
}
