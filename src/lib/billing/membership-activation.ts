import {
  ParentSubscription,
  PendingMembership,
  SubscriptionPlan,
  User,
} from "@/models";
import type { SubscriptionStatus } from "@/models/Billing";

export async function activateMembershipForUser(params: {
  userId: string;
  planId: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  stripeCustomerId?: string;
  currentPeriodEnd?: Date;
  status?: SubscriptionStatus;
}) {
  const status = params.status ?? "active";

  if (params.stripeCustomerId) {
    await User.findByIdAndUpdate(params.userId, {
      stripeCustomerId: params.stripeCustomerId,
    });
  }

  await ParentSubscription.findOneAndUpdate(
    { userId: params.userId },
    {
      planId: params.planId,
      status,
      stripeSubscriptionId: params.stripeSubscriptionId,
      stripePriceId: params.stripePriceId,
      currentPeriodEnd: params.currentPeriodEnd,
      cancelAtPeriodEnd: false,
    },
    { upsert: true, new: true }
  );
}

export async function savePendingMembership(params: {
  email: string;
  planId: string;
  stripeSubscriptionId: string;
  stripeCustomerId?: string;
  stripePriceId?: string;
  currentPeriodEnd?: Date;
}) {
  const email = params.email.toLowerCase().trim();
  await PendingMembership.findOneAndUpdate(
    { email },
    {
      email,
      planId: params.planId,
      stripeSubscriptionId: params.stripeSubscriptionId,
      stripeCustomerId: params.stripeCustomerId,
      stripePriceId: params.stripePriceId,
      currentPeriodEnd: params.currentPeriodEnd,
    },
    { upsert: true, new: true }
  );
}

export async function claimPendingMembership(userId: string, email: string): Promise<boolean> {
  const normalized = email.toLowerCase().trim();
  const pending = await PendingMembership.findOne({ email: normalized });
  if (!pending) return false;

  await activateMembershipForUser({
    userId,
    planId: pending.planId.toString(),
    stripeSubscriptionId: pending.stripeSubscriptionId,
    stripePriceId: pending.stripePriceId,
    stripeCustomerId: pending.stripeCustomerId,
    currentPeriodEnd: pending.currentPeriodEnd,
    status: "active",
  });

  await PendingMembership.deleteOne({ _id: pending._id });
  return true;
}

export async function resolvePlanIdFromSlug(planSlug: string): Promise<string | null> {
  const plan = await SubscriptionPlan.findOne({ slug: planSlug, isActive: true });
  return plan ? plan._id.toString() : null;
}
