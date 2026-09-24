import connectDB from "@/lib/db";
import { SubscriptionPlan, User } from "@/models";
import { buildSubscriptionPlanSeedRows } from "@/lib/membership/plans";
import {
  createCheckoutSession,
  getAppUrl,
  isStripeConfigured,
} from "@/lib/services/stripe";
import { getOrCreateStripeCustomer } from "@/lib/billing/stripe-customer";
import { stripeProductData } from "@/lib/stripe/tax-codes";

async function ensurePlanInDb(slug: string) {
  let plan = await SubscriptionPlan.findOne({ slug, isActive: true });
  if (plan) return plan;

  const row = buildSubscriptionPlanSeedRows().find((entry) => entry.slug === slug);
  if (!row) return null;

  plan = await SubscriptionPlan.findOneAndUpdate({ slug }, row, {
    upsert: true,
    new: true,
    setDefaultsOnInsert: true,
  });
  return plan;
}

export async function createMembershipCheckoutSession(params: {
  planSlug: string;
  userId?: string;
  customerEmail?: string;
}) {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured");
  }

  await connectDB();
  const plan = await ensurePlanInDb(params.planSlug);
  if (!plan) {
    throw new Error("Membership plan not found");
  }

  const appUrl = getAppUrl();
  const metadata: Record<string, string> = {
    checkoutType: "membership",
    planId: plan._id.toString(),
    planSlug: plan.slug,
  };

  let customerEmail = params.customerEmail?.toLowerCase().trim();
  let stripeCustomerId: string | undefined;

  if (params.userId) {
    const user = await User.findById(params.userId).select("email role").lean();
    if (!user || user.role !== "parent") {
      throw new Error("Parent account not found");
    }
    metadata.userId = params.userId;
    customerEmail = customerEmail || user.email?.toLowerCase();
    try {
      stripeCustomerId = (await getOrCreateStripeCustomer(params.userId)) ?? undefined;
    } catch {
      // Continue with email-only checkout
    }
  }

  const lineItem = plan.stripePriceId
    ? { price: plan.stripePriceId, quantity: 1 }
    : {
        price_data: {
          currency: "usd",
          product_data: stripeProductData(
            {
              name: plan.name,
              description: plan.description || undefined,
            },
            "membership"
          ),
          unit_amount: plan.priceCents,
          recurring: {
            interval: plan.interval,
          },
        },
        quantity: 1,
      };

  const checkoutSession = await createCheckoutSession({
    lineItems: [lineItem],
    mode: "subscription",
    metadata,
    customerEmail,
    customer: stripeCustomerId,
    successUrl: `${appUrl}/membership/success?session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl: `${appUrl}/parent/billing`,
  });

  if (!checkoutSession.url) {
    throw new Error("Unable to create checkout session");
  }

  return {
    url: checkoutSession.url,
    sessionId: checkoutSession.id,
    planName: plan.name,
  };
}
