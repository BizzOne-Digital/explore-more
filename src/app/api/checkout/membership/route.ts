import { z } from "zod";
import { jsonOk, jsonError } from "@/lib/api/response";
import { auth } from "@/lib/auth";
import { createMembershipCheckoutSession } from "@/lib/billing/membership-checkout";
import { isStripeConfigured } from "@/lib/services/stripe";

const checkoutSchema = z.object({
  planSlug: z.string().min(1),
});

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

    const session = await auth();
    const userId =
      session?.user?.id && session.user.role === "parent" ? session.user.id : undefined;

    const checkout = await createMembershipCheckoutSession({
      planSlug: parsed.data.planSlug,
      userId,
      customerEmail: session?.user?.email ?? undefined,
    });

    return jsonOk({ sessionId: checkout.sessionId, url: checkout.url });
  } catch (error) {
    console.error("Membership checkout error:", error);
    return jsonError(
      error instanceof Error ? error.message : "Membership checkout failed",
      500
    );
  }
}
