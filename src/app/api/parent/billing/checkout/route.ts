import { z } from "zod";
import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { ParentSubscription } from "@/models";
import { createMembershipCheckoutSession } from "@/lib/billing/membership-checkout";
import { getStripe } from "@/lib/services/stripe";

const bodySchema = z.object({
  planSlug: z.string().min(1).optional(),
});

export async function POST(request: Request) {
  try {
    const sessionResult = await requireRole(["parent"]);
    if ("error" in sessionResult) return sessionResult.error;

    if (!getStripe()) {
      return apiError(
        new Error("Online membership checkout is not available. Please contact the academy."),
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

    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return apiError(new Error("Invalid checkout request"), 400);
    }

    await connectDB();
    const userId = sessionResult.user.id;

    let planSlug = parsed.data.planSlug;
    if (!planSlug) {
      const sub = await ParentSubscription.findOne({ userId }).populate("planId").lean();
      const plan = sub?.planId;
      if (plan && typeof plan === "object" && "slug" in plan && plan.slug) {
        planSlug = plan.slug as string;
      } else {
        planSlug = "pathfinder";
      }
    }

    const checkout = await createMembershipCheckoutSession({
      userId,
      planSlug,
    });

    return apiSuccess({ url: checkout.url, planName: checkout.planName });
  } catch (error) {
    return apiError(error);
  }
}
