import { z } from "zod";
import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import {
  cancelSubscription,
  resumeSubscription,
} from "@/lib/billing/subscription-management";
import { getParentBillingSummary, listActivePlans, canManageStripeSubscription, canCancelStripeSubscription } from "@/lib/billing/parent-billing";
import { getStripe } from "@/lib/services/stripe";

const cancelSchema = z.object({
  action: z.enum(["cancel", "resume"]),
  atPeriodEnd: z.boolean().optional().default(true),
});

export async function POST(request: Request) {
  try {
    const sessionResult = await requireRole(["parent"]);
    if ("error" in sessionResult) return sessionResult.error;

    if (!getStripe()) {
      return apiError(
        new Error("Online cancellation is not available. Please contact the academy."),
        503
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError(new Error("Invalid request body"), 400);
    }

    const parsed = cancelSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message ?? "Invalid request", 400);
    }

    await connectDB();

    if (parsed.data.action === "resume") {
      await resumeSubscription(sessionResult.user.id);
    } else {
      await cancelSubscription(sessionResult.user.id, parsed.data.atPeriodEnd);
    }

    const [data, plans] = await Promise.all([
      getParentBillingSummary(sessionResult.user.id),
      listActivePlans(),
    ]);

    return apiSuccess({
      ...data,
      plans,
      canManageSubscription: canManageStripeSubscription(data.stripeConfigured, data.subscription),
      canCancelSubscription: canCancelStripeSubscription(data.stripeConfigured, data.subscription),
    });
  } catch (error) {
    return apiError(error instanceof Error ? error : new Error("Failed to update subscription"));
  }
}
