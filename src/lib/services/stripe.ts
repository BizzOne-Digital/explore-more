import Stripe from "stripe";

let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeInstance) {
    stripeInstance = new Stripe(key, { apiVersion: "2026-07-29.dahlia" });
  }
  return stripeInstance;
}

export function isStripeConfigured(): boolean {
  return !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET);
}

export function getAppUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export async function createCheckoutSession(params: {
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
  mode: "payment" | "subscription";
  metadata: Record<string, string>;
  customerEmail?: string;
  customer?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error("Stripe is not configured. Please set STRIPE_SECRET_KEY.");
  }

  return stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: params.lineItems,
    mode: params.mode,
    metadata: params.metadata,
    customer: params.customer,
    customer_email: params.customer ? undefined : params.customerEmail,
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
  });
}

export async function retrieveCheckoutSession(
  sessionId: string
): Promise<Stripe.Checkout.Session | null> {
  const stripe = getStripe();
  if (!stripe) return null;
  return stripe.checkout.sessions.retrieve(sessionId);
}

export function constructWebhookEvent(body: string, signature: string): Stripe.Event {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    throw new Error("Stripe webhook is not configured");
  }
  return stripe.webhooks.constructEvent(body, signature, secret);
}
