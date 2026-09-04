import type Stripe from "stripe";
import { ParentSubscription, SubscriptionPlan, User } from "@/models";
import { getStripe } from "@/lib/services/stripe";
import { stripeProductData } from "@/lib/stripe/tax-codes";

const MANAGEABLE_STATUSES = new Set(["active", "trialing", "past_due"]);

export type BillingPortalFlow =
  | { type: "default" }
  | { type: "payment_method" }
  | { type: "subscription_update"; subscriptionId: string }
  | { type: "subscription_cancel"; subscriptionId: string };

export async function ensureStripeSubscriptionLinked(userId: string) {
  const stripe = getStripe();
  let record = await ParentSubscription.findOne({ userId }).populate("planId").lean();

  if (!stripe) {
    return {
      record,
      stripeSubscription: null as Stripe.Subscription | null,
      stripeSubscriptionId: record?.stripeSubscriptionId ?? null,
    };
  }

  const user = await User.findById(userId).select("stripeCustomerId email").lean();
  if (!user) {
    return {
      record,
      stripeSubscription: null,
      stripeSubscriptionId: record?.stripeSubscriptionId ?? null,
    };
  }

  let customerId = user.stripeCustomerId;
  if (!customerId && user.email) {
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    customerId = customers.data[0]?.id;
    if (customerId) {
      await User.findByIdAndUpdate(userId, { stripeCustomerId: customerId });
    }
  }

  if (record?.stripeSubscriptionId) {
    try {
      const existing = await stripe.subscriptions.retrieve(record.stripeSubscriptionId);
      if (MANAGEABLE_STATUSES.has(existing.status)) {
        await syncSubscriptionFromStripe(userId, existing);
        record = await ParentSubscription.findOne({ userId }).populate("planId").lean();
        return {
          record,
          stripeSubscription: existing,
          stripeSubscriptionId: existing.id,
        };
      }
    } catch {
      // Stored subscription id is stale — look up by customer below.
    }
  }

  if (customerId) {
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      limit: 20,
    });

    const manageable =
      subscriptions.data.find((sub) => MANAGEABLE_STATUSES.has(sub.status)) ??
      subscriptions.data.find((sub) => sub.status !== "canceled");

    if (manageable) {
      await syncSubscriptionFromStripe(userId, manageable);
      record = await ParentSubscription.findOne({ userId }).populate("planId").lean();
      return {
        record,
        stripeSubscription: manageable,
        stripeSubscriptionId: manageable.id,
      };
    }
  }

  return {
    record,
    stripeSubscription: null,
    stripeSubscriptionId: record?.stripeSubscriptionId ?? null,
  };
}

export async function getParentStripeSubscription(userId: string) {
  const linked = await ensureStripeSubscriptionLinked(userId);
  return {
    record: linked.record,
    stripeSubscription: linked.stripeSubscription,
  };
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

function readPeriodStart(subscription: Stripe.Subscription): number | undefined {
  return (subscription as Stripe.Subscription & { current_period_start?: number })
    .current_period_start;
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
      ...(plan?._id &&
      stripeSubscription.metadata?.planId === plan._id.toString()
        ? { pendingPlanId: null, pendingPlanEffectiveAt: null }
        : {}),
    },
    { upsert: true }
  );

  return plan;
}

export async function changeSubscriptionPlan(userId: string, targetPlanId: string) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Online plan changes are not available. Please contact the academy.");

  await ensureStripeSubscriptionLinked(userId);

  const [record, targetPlan] = await Promise.all([
    ParentSubscription.findOne({ userId }),
    SubscriptionPlan.findOne({ _id: targetPlanId, isActive: true }),
  ]);

  if (!record?.stripeSubscriptionId) {
    throw new Error("No active subscription found. Please subscribe from the membership page first.");
  }
  if (!targetPlan) throw new Error("Plan not found");

  const currentPlanId = record.planId?.toString();
  const pendingPlanId = record.pendingPlanId?.toString();
  if (currentPlanId === targetPlanId) {
    throw new Error("You are already on this plan.");
  }
  if (pendingPlanId === targetPlanId) {
    throw new Error("This plan change is already scheduled for your next billing date.");
  }

  const stripeSubscription = await stripe.subscriptions.retrieve(record.stripeSubscriptionId);
  const currentItem = stripeSubscription.items.data[0];
  if (!currentItem?.price?.id) {
    throw new Error("Subscription could not be updated. Please contact the academy.");
  }

  const newPriceId = await ensurePlanStripePrice(targetPlan);
  const periodStart = readPeriodStart(stripeSubscription);
  const periodEnd = (stripeSubscription as Stripe.Subscription & { current_period_end?: number })
    .current_period_end;

  if (!periodStart || !periodEnd) {
    throw new Error("Could not determine your billing cycle. Please contact the academy.");
  }

  if (stripeSubscription.schedule) {
    const scheduleId =
      typeof stripeSubscription.schedule === "string"
        ? stripeSubscription.schedule
        : stripeSubscription.schedule.id;
    try {
      await stripe.subscriptionSchedules.release(scheduleId);
    } catch {
      // Schedule may already be released.
    }
  }

  const schedule = await stripe.subscriptionSchedules.create({
    from_subscription: stripeSubscription.id,
  });

  await stripe.subscriptionSchedules.update(schedule.id, {
    end_behavior: "release",
    phases: [
      {
        items: [{ price: currentItem.price.id, quantity: 1 }],
        start_date: periodStart,
        end_date: periodEnd,
      },
      {
        items: [{ price: newPriceId, quantity: 1 }],
        metadata: {
          planId: targetPlan._id.toString(),
          planSlug: targetPlan.slug,
        },
      },
    ],
  });

  const effectiveAt = new Date(periodEnd * 1000);

  await ParentSubscription.findOneAndUpdate(
    { userId },
    {
      pendingPlanId: targetPlan._id,
      pendingPlanEffectiveAt: effectiveAt,
    }
  );

  return {
    planName: targetPlan.name,
    status: stripeSubscription.status,
    currentPeriodEnd: effectiveAt,
    scheduled: true,
    effectiveAt,
  };
}

export async function cancelSubscription(userId: string, atPeriodEnd = true) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Online cancellation is not available. Please contact the academy.");

  await ensureStripeSubscriptionLinked(userId);

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

  await ensureStripeSubscriptionLinked(userId);

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
