import type Stripe from "stripe";
import { ParentSubscription, SubscriptionPlan } from "@/models";
import { getStripe } from "@/lib/services/stripe";
import { stripeProductData } from "@/lib/stripe/tax-codes";

export type BillingPortalFlow =
  | { type: "default" }
  | { type: "payment_method" }
  | { type: "subscription_update"; subscriptionId: string }
  | { type: "subscription_cancel"; subscriptionId: string };

export async function getParentStripeSubscription(userId: string) {
  const record = await ParentSubscription.findOne({ userId }).populate("planId").lean();
  if (!record?.stripeSubscriptionId) {
    return { record, stripeSubscription: null as Stripe.Subscription | null };
  }

  const stripe = getStripe();
  if (!stripe) {
    return { record, stripeSubscription: null };
  }

  try {
    const stripeSubscription = await stripe.subscriptions.retrieve(record.stripeSubscriptionId);
    return { record, stripeSubscription };
  } catch (err) {
    console.error("Failed to retrieve Stripe subscription:", err);
    return { record, stripeSubscription: null };
  }
}

async function ensurePlanStripePrice(plan: {
  _id: { toString(): string };
  name: string;
  slug: string;
  description?: string;
  priceCents: number;
  interval: "month" | "year";
  stripePriceId?: string;
}): Promise<string> {
  if (plan.stripePriceId) return plan.stripePriceId;

  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured");

  const price = await stripe.prices.create({
    currency: "usd",
    unit_amount: plan.priceCents,
    recurring: { interval: plan.interval },
    product_data: stripeProductData(
      {
        name: plan.name,
        description: plan.description || undefined,
      },
      "membership"
    ),
    metadata: {
      planId: plan._id.toString(),
      planSlug: plan.slug,
    },
  });

  await SubscriptionPlan.findByIdAndUpdate(plan._id, { stripePriceId: price.id });
  return price.id;
}

function readPeriodEnd(subscription: Stripe.Subscription): Date | undefined {
  const periodEnd = (subscription as Stripe.Subscription & { current_period_end?: number })
    .current_period_end;
  return periodEnd ? new Date(periodEnd * 1000) : undefined;
}

export async function syncSubscriptionFromStripe(
  userId: string,
  stripeSubscription: Stripe.Subscription
) {
  const priceId = stripeSubscription.items.data[0]?.price?.id;
  const plan =
    priceId != null
      ? await SubscriptionPlan.findOne({
          $or: [{ stripePriceId: priceId }, { slug: stripeSubscription.metadata?.planSlug }],
          isActive: true,
        }).lean()
      : null;

  const status = stripeSubscription.status;
  const mappedStatus =
    status === "active"
      ? "active"
      : status === "trialing"
        ? "trialing"
        : status === "past_due"
          ? "past_due"
          : status === "canceled" || status === "unpaid"
            ? "canceled"
            : status === "paused"
              ? "paused"
              : "none";

  await ParentSubscription.findOneAndUpdate(
    { userId },
    {
      planId: plan?._id,
      status: mappedStatus,
      stripeSubscriptionId: stripeSubscription.id,
      stripePriceId: priceId,
      currentPeriodEnd: readPeriodEnd(stripeSubscription),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    },
    { upsert: true }
  );

  return plan;
}

export async function changeSubscriptionPlan(userId: string, targetPlanId: string) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Online plan changes are not available. Please contact the academy.");

  const [record, targetPlan] = await Promise.all([
    ParentSubscription.findOne({ userId }),
    SubscriptionPlan.findOne({ _id: targetPlanId, isActive: true }),
  ]);

  if (!record?.stripeSubscriptionId) {
    throw new Error("No active subscription found. Please subscribe from the membership page first.");
  }
  if (!targetPlan) throw new Error("Plan not found");

  const currentPlanId = record.planId?.toString();
  if (currentPlanId === targetPlanId) {
    throw new Error("You are already on this plan.");
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(record.stripeSubscriptionId);
  const itemId = stripeSubscription.items.data[0]?.id;
  if (!itemId) throw new Error("Subscription could not be updated. Please contact the academy.");

  const priceId = await ensurePlanStripePrice(targetPlan);
  const updated = await stripe.subscriptions.update(record.stripeSubscriptionId, {
    items: [{ id: itemId, price: priceId }],
    proration_behavior: "create_prorations",
    metadata: {
      planId: targetPlan._id.toString(),
      planSlug: targetPlan.slug,
    },
  });

  await ParentSubscription.findOneAndUpdate(
    { userId },
    {
      planId: targetPlan._id,
      stripePriceId: priceId,
      status:
        updated.status === "trialing"
          ? "trialing"
          : updated.status === "active"
            ? "active"
            : record.status,
      currentPeriodEnd: readPeriodEnd(updated),
      cancelAtPeriodEnd: updated.cancel_at_period_end,
    }
  );

  return {
    planName: targetPlan.name,
    status: updated.status,
    currentPeriodEnd: readPeriodEnd(updated),
  };
}

export async function cancelSubscription(userId: string, atPeriodEnd = true) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Online cancellation is not available. Please contact the academy.");

  const record = await ParentSubscription.findOne({ userId });
  if (!record?.stripeSubscriptionId) {
    throw new Error("No active subscription found to cancel.");
  }

  if (atPeriodEnd) {
    const updated = await stripe.subscriptions.update(record.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    await ParentSubscription.findOneAndUpdate(
      { userId },
      {
        cancelAtPeriodEnd: true,
        currentPeriodEnd: readPeriodEnd(updated),
      }
    );
    return {
      cancelAtPeriodEnd: true,
      currentPeriodEnd: readPeriodEnd(updated),
    };
  }

  const updated = await stripe.subscriptions.cancel(record.stripeSubscriptionId);
  await ParentSubscription.findOneAndUpdate(
    { userId },
    {
      status: "canceled",
      cancelAtPeriodEnd: false,
      currentPeriodEnd: readPeriodEnd(updated),
    }
  );
  return {
    cancelAtPeriodEnd: false,
    currentPeriodEnd: readPeriodEnd(updated),
  };
}

export async function resumeSubscription(userId: string) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Unable to resume subscription.");

  const record = await ParentSubscription.findOne({ userId });
  if (!record?.stripeSubscriptionId) {
    throw new Error("No subscription found.");
  }

  const updated = await stripe.subscriptions.update(record.stripeSubscriptionId, {
    cancel_at_period_end: false,
  });

  await ParentSubscription.findOneAndUpdate(
    { userId },
    {
      cancelAtPeriodEnd: false,
      currentPeriodEnd: readPeriodEnd(updated),
      status:
        updated.status === "trialing"
          ? "trialing"
          : updated.status === "active"
            ? "active"
            : record.status,
    }
  );

  return {
    cancelAtPeriodEnd: false,
    currentPeriodEnd: readPeriodEnd(updated),
  };
}
