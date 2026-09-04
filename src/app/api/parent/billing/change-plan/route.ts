import { z } from "zod";
import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { changeSubscriptionPlan } from "@/lib/billing/subscription-management";
import { getParentBillingSummary, listActivePlans } from "@/lib/billing/parent-billing";
import { getStripe } from "@/lib/services/stripe";

const changePlanSchema = z.object({
  planId: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const sessionResult = await requireRole(["parent"]);
    if ("error" in sessionResult) return sessionResult.error;

    if (!getStripe()) {
      return apiError(
        new Error("Online plan changes are not available. Please contact the academy."),
        503
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError(new Error("Invalid request body"), 400);
    }

    const parsed = changePlanSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.errors[0]?.message ?? "Plan is required", 400);
    }

    await connectDB();
    const result = await changeSubscriptionPlan(sessionResult.user.id, parsed.data.planId);

    const [data, plans] = await Promise.all([
      getParentBillingSummary(sessionResult.user.id),
      listActivePlans(),
    ]);

    return apiSuccess({
      ...data,
      plans,
      canManageSubscription: !!data.stripeConfigured,
      changeResult: result,
    });
  } catch (error) {
    return apiError(error instanceof Error ? error : new Error("Failed to change plan"));
  }
}
