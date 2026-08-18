import { isStripeConfigured, retrieveCheckoutSession } from "@/lib/services/stripe";
import { jsonOk, jsonError } from "@/lib/api/response";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return jsonError("session_id is required");
    }

    if (!isStripeConfigured()) {
      return jsonOk({ email: "", planSlug: null, status: "complete" });
    }

    const session = await retrieveCheckoutSession(sessionId);
    if (!session) {
      return jsonError("Checkout session not found", 404);
    }

    const email = session.customer_email || session.customer_details?.email || "";

    return jsonOk({
      email,
      planSlug: session.metadata?.planSlug ?? null,
      status: session.status,
    });
  } catch (error) {
    console.error("Membership session lookup error:", error);
    return jsonError("Could not load checkout session", 500);
  }
}