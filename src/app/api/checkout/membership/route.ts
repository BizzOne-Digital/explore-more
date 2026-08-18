import { z } from "zod";
import connectDB from "@/lib/db";
import { SubscriptionPlan } from "@/models";
import { buildSubscriptionPlanSeedRows } from "@/lib/membership/plans";
import {
  createCheckoutSession,
  getAppUrl,
  isStripeConfigured,
} from "@/lib/services/stripe";
import { jsonOk, jsonError } from "@/lib/api/response";
import { auth } from "@/lib/auth";
import { getOrCreateStripeCustomer } from "@/lib/billing/stripe-customer";

const checkoutSchema = z.object({
  planSlug: z.string().min(1),
});

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

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonError("Invalid JSON body");
    }

    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Plan is required");
    }

    if (!isStripeConfigured()) {
      return jsonError(
        "Online membership checkout is not available yet. Please contact the academy to enroll.",
        503
      );
    }

    await connectDB();
    const plan = await ensurePlanInDb(parsed.data.planSlug);
    if (!plan) {
      return jsonError("Membership plan not found", 404);
    }

    const session = await auth();
    const appUrl = getAppUrl();
    const metadata: Record<string, string> = {
      checkoutType: "membership",
      planId: plan._id.toString(),
      planSlug: plan.slug,
    };

    let customerEmail: string | undefined;
    let stripeCustomerId: string | undefined;

    if (session?.user?.id && session.user.role === "parent") {
      metadata.userId = session.user.id;
      customerEmail = session.user.email ?? undefined;
      try {
        stripeCustomerId = (await getOrCreateStripeCustomer(session.user.id)) ?? undefined;
      } catch {
        // Continue with email-only checkout
      }
    }

    const lineItem = plan.stripePriceId
      ? { price: plan.stripePriceId, quantity: 1 }
      : {
          price_data: {
            currency: "usd",
            product_data: {
              name: plan.name,
              description: plan.description || undefined,
            },
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
      cancelUrl: `${appUrl}/membership`,
    });

    return jsonOk({ sessionId: checkoutSession.id, url: checkoutSession.url });
  } catch (error) {
    console.error("Membership checkout error:", error);
    return jsonError(
      error instanceof Error ? error.message : "Membership checkout failed",
      500
    );
  }
}
