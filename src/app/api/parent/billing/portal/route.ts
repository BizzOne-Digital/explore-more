import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { createBillingPortalSession } from "@/lib/billing/stripe-customer";
import { getStripe } from "@/lib/services/stripe";

export async function POST() {
  try {
    const sessionResult = await requireRole(["parent"]);
    if ("error" in sessionResult) return sessionResult.error;

    if (!getStripe()) {
      return apiError(
        new Error("Online payment management is not configured. Please contact the academy."),
        503
      );
    }

    await connectDB();
    const url = await createBillingPortalSession(sessionResult.user.id);
    if (!url) {
      return apiError(new Error("Unable to open billing portal"), 500);
    }

    return apiSuccess({ url });
  } catch (error) {
    return apiError(error);
  }
}
