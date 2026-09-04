import { z } from "zod";
import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { createBillingPortalSession } from "@/lib/billing/stripe-customer";
import { getParentStripeSubscription } from "@/lib/billing/subscription-management";
import { getStripe } from "@/lib/services/stripe";

const portalSchema = z.object({
  flow: z.enum(["payment_method", "subscription_manage", "subscription_cancel"]).optional(),
});

export async function POST(request: Request) {
  try {
    const sessionResult = await requireRole(["parent"]);
    if ("error" in sessionResult) return sessionResult.error;

    if (!getStripe()) {
      return apiError(
        new Error("Online payment management is not configured. Please contact the academy."),
        503
      );
    }

    let body: unknown = {};
    try {
      const text = await request.text();
      if (text) body = JSON.parse(text);
    } catch {
      return apiError(new Error("Invalid request body"), 400);
    }

    const parsed = portalSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(new Error("Invalid portal request"), 400);
    }

    await connectDB();
    const flowType = parsed.data.flow ?? "subscription_manage";
    const { record } = await getParentStripeSubscription(sessionResult.user.id);
    const subscriptionId = record?.stripeSubscriptionId;

    let url: string | null = null;

    if (flowType === "payment_method") {
      url = await createBillingPortalSession(sessionResult.user.id, "/parent/billing", {
        type: "payment_method",
      });
    } else if (flowType === "subscription_cancel") {
      if (!subscriptionId) {
        return apiError(new Error("No active subscription found to cancel."), 400);
      }
      url = await createBillingPortalSession(sessionResult.user.id, "/parent/billing", {
        type: "subscription_cancel",
        subscriptionId,
      });
    } else if (subscriptionId) {
      url = await createBillingPortalSession(sessionResult.user.id, "/parent/billing", {
        type: "subscription_update",
        subscriptionId,
      });
    } else {
      url = await createBillingPortalSession(sessionResult.user.id, "/parent/billing", {
        type: "default",
      });
    }

    if (!url) {
      return apiError(new Error("Unable to open billing portal"), 500);
    }

    return apiSuccess({ url });
  } catch (error) {
    return apiError(error);
  }
}
