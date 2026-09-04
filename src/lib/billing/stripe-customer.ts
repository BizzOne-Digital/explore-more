import type Stripe from "stripe";
import { User } from "@/models";
import type { IPaymentMethodSnapshot } from "@/models/Billing";
import { getAppUrl, getStripe } from "@/lib/services/stripe";
import type { BillingPortalFlow } from "@/lib/billing/subscription-management";

export async function getOrCreateStripeCustomer(userId: string): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: { userId: user._id.toString() },
  });

  user.stripeCustomerId = customer.id;
  await user.save();

  return customer.id;
}

export async function getDefaultPaymentMethod(
  customerId: string
): Promise<IPaymentMethodSnapshot | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const customer = (await stripe.customers.retrieve(customerId)) as Stripe.Customer;
  if (customer.deleted) return null;

  const defaultPmId =
    typeof customer.invoice_settings?.default_payment_method === "string"
      ? customer.invoice_settings.default_payment_method
      : customer.invoice_settings?.default_payment_method?.id;

  if (!defaultPmId) {
    const methods = await stripe.paymentMethods.list({
      customer: customerId,
      type: "card",
      limit: 1,
    });
    const pm = methods.data[0];
    if (!pm?.card) return null;
    return {
      brand: pm.card.brand,
      last4: pm.card.last4,
      expMonth: pm.card.exp_month,
      expYear: pm.card.exp_year,
    };
  }

  const pm = await stripe.paymentMethods.retrieve(defaultPmId);
  if (!pm.card) return null;
  return {
    brand: pm.card.brand,
    last4: pm.card.last4,
    expMonth: pm.card.exp_month,
    expYear: pm.card.exp_year,
  };
}

export async function createBillingPortalSession(
  userId: string,
  returnPath = "/parent/billing",
  flow: BillingPortalFlow = { type: "default" }
): Promise<string | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  try {
    const customerId = await getOrCreateStripeCustomer(userId);
    if (!customerId) return null;

    const params: Stripe.BillingPortal.SessionCreateParams = {
      customer: customerId,
      return_url: `${getAppUrl()}${returnPath}`,
    };

    if (flow.type === "payment_method") {
      params.flow_data = { type: "payment_method_update" };
    } else if (flow.type === "subscription_update") {
      params.flow_data = {
        type: "subscription_update",
        subscription_update: { subscription: flow.subscriptionId },
      };
    } else if (flow.type === "subscription_cancel") {
      params.flow_data = {
        type: "subscription_cancel",
        subscription_cancel: { subscription: flow.subscriptionId },
      };
    }

    const session = await stripe.billingPortal.sessions.create(params);

    return session.url;
  } catch (err) {
    console.error("Failed to create Stripe billing portal session:", err);
    return null;
  }
}
