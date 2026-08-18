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

export async function getParentBillingSummary(userId: string) {
  const [user, profile, subscription] = await Promise.all([
    User.findById(userId).select("name email phone stripeCustomerId guardianId").lean(),
    ParentProfile.findOne({ userId }).lean(),
    ParentSubscription.findOne({ userId }).populate("planId").lean(),
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

  const paymentHistory = await getPaymentHistoryForParent({
    userId,
    email: user.email,
  });

  const stripeConfigured = !!getStripe();

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
        },
    paymentHistory,
    stripeConfigured,
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
