import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { ParentProfile } from "@/models";
import { getParentBillingSummary, ensureParentSubscription, listActivePlans, canManageStripeSubscription } from "@/lib/billing/parent-billing";
import { buildPartialUpdate } from "@/lib/billing/utils";

export async function GET() {
  try {
    const sessionResult = await requireRole(["parent"]);
    if ("error" in sessionResult) return sessionResult.error;

    await connectDB();
    await ensureParentSubscription(sessionResult.user.id);
    const [data, plans] = await Promise.all([
      getParentBillingSummary(sessionResult.user.id),
      listActivePlans(),
    ]);
    return apiSuccess({
      ...data,
      plans,
      canManageSubscription: canManageStripeSubscription(data.stripeConfigured, data.subscription),
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const sessionResult = await requireRole(["parent"]);
    if ("error" in sessionResult) return sessionResult.error;

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return apiError(new Error("Invalid request body"), 400);
    }

    await connectDB();

    const profileUpdate = buildPartialUpdate(body, [
      "billingName",
      "billingEmail",
      "billingPhone",
      "billingAddress",
    ]);

    if (typeof profileUpdate.billingName === "string") {
      profileUpdate.billingName = profileUpdate.billingName.trim();
    }
    if (typeof profileUpdate.billingEmail === "string") {
      profileUpdate.billingEmail = profileUpdate.billingEmail.trim().toLowerCase();
    }

    if (Object.keys(profileUpdate).length > 0) {
      await ParentProfile.findOneAndUpdate(
        { userId: sessionResult.user.id },
        profileUpdate,
        { upsert: true, new: true }
      );
    }

    const [data, plans] = await Promise.all([
      getParentBillingSummary(sessionResult.user.id),
      listActivePlans(),
    ]);
    return apiSuccess({
      ...data,
      plans,
      canManageSubscription: canManageStripeSubscription(data.stripeConfigured, data.subscription),
    });
  } catch (error) {
    return apiError(error);
  }
}
