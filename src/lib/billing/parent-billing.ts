import {
  User,
  ParentProfile,
  ParentSubscription,
  SubscriptionPlan,
} from "@/models";
import { getDefaultPaymentMethod } from "./stripe-customer";
import { getPaymentHistoryForParent } from "./payment-history";
import { getStripe } from "@/lib/services/stripe";
import { resolveMongoId } from "./utils";
import { getParentMembershipAccess } from "@/lib/membership/access";
import { previewPortalAccess } from "@/lib/membership/portal-preview";
import { ensureStripeSubscriptionLinked } from "./subscription-management";

const MANAGEABLE_STATUSES = new Set(["active", "trialing", "past_due"]);

export function canManageStripeSubscription(
  stripeConfigured: boolean,
  subscription?: { status?: string; stripeSubscriptionId?: string | null }
) {
  return (
    stripeConfigured &&
    !!subscription?.stripeSubscriptionId &&
    MANAGEABLE_STATUSES.has(subscription.status ?? "none")
  );
}

export function canCancelStripeSubscription(
  stripeConfigured: boolean,
  subscription?: { status?: string; stripeSubscriptionId?: string | null; planId?: string }
) {
  if (!stripeConfigured) return false;
  const status = subscription?.status ?? "none";
  const hasMembership =
    MANAGEABLE_STATUSES.has(status) || status === "paused" || !!subscription?.planId;
  return hasMembership || !!subscription?.stripeSubscriptionId;
}

export async function getParentBillingSummary(userId: string) {
  await ensureStripeSubscriptionLinked(userId);

  const [user, profile, subscription] = await Promise.all([
    User.findById(userId).select("name email phone stripeCustomerId guardianId").lean(),
    ParentProfile.findOne({ userId }).lean(),
    ParentSubscription.findOne({ userId })
      .populate("planId")
      .populate("pendingPlanId")
      .lean(),
  ]);

  if (!user) throw new Error("User not found");

  let paymentMethod = null;
  if (user.stripeCustomerId) {
    try {
      paymentMethod = await getDefaultPaymentMethod(user.stripeCustomerId);
    } catch (err) {
      console.error("Failed to load Stripe payment method:", err);
    }
  }

  const planDoc = subscription?.planId;
  const plan =
    planDoc && typeof planDoc === "object" && "name" in planDoc
      ? (planDoc as {
          name?: string;
          slug?: string;
          priceCents?: number;
          interval?: "month" | "year";
          features?: string[];
          description?: string;
        })
      : null;

  const planId = resolveMongoId(planDoc);

  const pendingPlanDoc = subscription?.pendingPlanId;
  const pendingPlan =
    pendingPlanDoc && typeof pendingPlanDoc === "object" && "name" in pendingPlanDoc
      ? (pendingPlanDoc as { name?: string })
      : null;
  const pendingPlanId = resolveMongoId(pendingPlanDoc);

  const paymentHistory = await getPaymentHistoryForParent({
    userId,
    email: user.email,
  });

  const stripeConfigured = !!getStripe();

  const portalAccess = await getParentMembershipAccess(userId);
  const portalPreview = previewPortalAccess(plan?.slug, subscription?.status ?? "none");

  return {
    user: {
      name: user.name,
      email: user.email,
      phone: user.phone,
      guardianId: user.guardianId,
    },
    billing: {
      billingName: profile?.billingName ?? user.name,
      billingEmail: profile?.billingEmail ?? user.email,
      billingPhone: profile?.billingPhone ?? user.phone,
      billingAddress: profile?.billingAddress ?? profile?.mailingAddress ?? {},
    },
    paymentMethod,
    subscription: subscription
      ? {
          planId,
          status: subscription.status,
          planName: plan?.name ?? "No plan assigned",
          planSlug: plan?.slug,
          priceCents: plan?.priceCents ?? 0,
          interval: plan?.interval ?? "month",
          features: plan?.features ?? [],
          description: plan?.description,
          currentPeriodEnd: subscription.currentPeriodEnd,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          discountPercent: subscription.discountPercent,
          creditCents: subscription.creditCents,
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          pendingPlan: pendingPlanId
            ? {
                planId: pendingPlanId,
                planName: pendingPlan?.name ?? "Scheduled plan",
                effectiveAt: subscription.pendingPlanEffectiveAt,
              }
            : undefined,
        }
      : {
          status: "none" as const,
          planId: undefined,
          planName: "No plan assigned",
          priceCents: 0,
          interval: "month" as const,
          features: [],
          cancelAtPeriodEnd: false,
          discountPercent: 0,
          creditCents: 0,
          stripeSubscriptionId: undefined,
        },
    paymentHistory,
    stripeConfigured,
    portalAccess: {
      hasActiveMembership: portalAccess.hasActiveMembership,
      tierId: portalAccess.tierId,
      planName: portalAccess.planName,
      features: portalAccess.features,
      parentNavLabels: portalPreview.parentNavLabels,
      studentNavLabels: portalPreview.studentNavLabels,
    },
  };
}

export async function ensureParentSubscription(userId: string) {
  let sub = await ParentSubscription.findOne({ userId });
  if (!sub) {
    sub = await ParentSubscription.create({ userId, status: "none" });
  }
  return sub;
}

export async function listActivePlans() {
  return SubscriptionPlan.find({ isActive: true }).sort({ sortOrder: 1, priceCents: 1 }).lean();
}
