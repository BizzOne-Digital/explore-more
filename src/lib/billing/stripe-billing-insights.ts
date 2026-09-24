import type Stripe from "stripe";
import { User } from "@/models";
import { getStripe } from "@/lib/services/stripe";
import { ensureStripeSubscriptionLinked } from "./subscription-management";

export type BillingInsightStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "paused"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "none"
  | "no_stripe_subscription";

export interface StripeMembershipInvoiceRow {
  id: string;
  date: Date;
  amountCents: number;
  status: string;
  number: string | null;
  description: string;
}

export interface StripeBillingInsights {
  /** Membership record in our database */
  portalStatus: string;
  /** Live Stripe subscription status when linked */
  stripeStatus: BillingInsightStatus;
  /** Short label for admin/parent UI */
  statusLabel: string;
  /** Plain-language explanation (declined, paused, etc.) */
  statusDetail: string;
  paymentMethodOnFile: boolean;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  latestInvoiceStatus: string | null;
  latestInvoiceAmountDueCents: number | null;
  lastPaymentError: string | null;
  cancelAtPeriodEnd: boolean;
  stripePeriodEnd: string | null;
  /** Square / cash / manual payments are not stored as Stripe cards */
  externalPaymentsNote: string;
  membershipInvoices: StripeMembershipInvoiceRow[];
}

async function listMembershipInvoices(
  stripe: NonNullable<ReturnType<typeof getStripe>>,
  customerId: string
): Promise<StripeMembershipInvoiceRow[]> {
  const invoices = await stripe.invoices.list({ customer: customerId, limit: 24 });
  return invoices.data.map((inv) => ({
    id: inv.id,
    date: new Date((inv.created ?? 0) * 1000),
    amountCents: inv.amount_paid ?? inv.amount_due ?? 0,
    status: inv.status ?? "unknown",
    number: inv.number,
    description:
      inv.lines.data[0]?.description ??
      (inv.billing_reason === "subscription_cycle" ? "Membership renewal" : "Stripe invoice"),
  }));
}

function mapStripeStatus(status: Stripe.Subscription.Status | undefined): BillingInsightStatus {
  if (!status) return "no_stripe_subscription";
  if (status === "active") return "active";
  if (status === "trialing") return "trialing";
  if (status === "past_due") return "past_due";
  if (status === "paused") return "paused";
  if (status === "canceled") return "canceled";
  if (status === "unpaid") return "unpaid";
  if (status === "incomplete") return "incomplete";
  if (status === "incomplete_expired") return "incomplete_expired";
  return "none";
}

function buildStatusDetail(params: {
  stripeStatus: BillingInsightStatus;
  portalStatus: string;
  paymentMethodOnFile: boolean;
  latestInvoiceStatus: string | null;
  lastPaymentError: string | null;
  cancelAtPeriodEnd: boolean;
  hasStripeSubscription: boolean;
}): { statusLabel: string; statusDetail: string } {
  const { stripeStatus, portalStatus, paymentMethodOnFile, latestInvoiceStatus, lastPaymentError, cancelAtPeriodEnd, hasStripeSubscription } =
    params;

  if (!hasStripeSubscription && portalStatus === "active") {
    return {
      statusLabel: "Active (admin only)",
      statusDetail:
        "Membership shows Active in the academy admin, but there is no Stripe subscription linked. Automatic card billing will not run until the parent subscribes through Stripe or you record payment manually.",
    };
  }

  if (!hasStripeSubscription) {
    return {
      statusLabel: "No Stripe subscription",
      statusDetail:
        "No recurring Stripe subscription is linked to this account. Payments made in Square, cash, or check are not shown as a card on file here.",
    };
  }

  if (stripeStatus === "past_due" || latestInvoiceStatus === "open") {
    const decline = lastPaymentError ? ` Last attempt: ${lastPaymentError}` : "";
    return {
      statusLabel: "Payment failed / past due",
      statusDetail: `Stripe could not collect the latest renewal.${decline} Ask the parent to update their card in the billing portal.`,
    };
  }

  if (stripeStatus === "paused") {
    return {
      statusLabel: "Paused",
      statusDetail: "Billing is paused in Stripe. No charges will run until billing resumes.",
    };
  }

  if (cancelAtPeriodEnd) {
    return {
      statusLabel: "Canceling",
      statusDetail: "Subscription is active but set to cancel at the end of the current billing period.",
    };
  }

  if (stripeStatus === "canceled" || stripeStatus === "unpaid") {
    return {
      statusLabel: "Canceled",
      statusDetail: "Stripe subscription is canceled or unpaid. No further automatic charges.",
    };
  }

  if (stripeStatus === "incomplete" || stripeStatus === "incomplete_expired") {
    return {
      statusLabel: "Incomplete signup",
      statusDetail: "Checkout was started but never completed in Stripe.",
    };
  }

  if (stripeStatus === "trialing") {
    return {
      statusLabel: "Trial",
      statusDetail: paymentMethodOnFile
        ? "In a free trial; Stripe will charge when the trial ends if a card is on file."
        : "In a free trial with no card on file — add a payment method before the trial ends.",
    };
  }

  if (stripeStatus === "active") {
    if (!paymentMethodOnFile) {
      return {
        statusLabel: "Active — no card on file",
        statusDetail:
          "Stripe subscription is active but no default card is saved. Renewals may fail unless the parent adds a card in the billing portal (Square payments are separate and do not appear here).",
      };
    }
    return {
      statusLabel: "Active — billing OK",
      statusDetail: "Stripe subscription is active and a payment method is on file for renewals.",
    };
  }

  return {
    statusLabel: portalStatus,
    statusDetail: "See Stripe dashboard for full billing details.",
  };
}

export async function getStripeBillingInsights(userId: string): Promise<StripeBillingInsights> {
  const externalPaymentsNote =
    "Explore More membership renewals run through Stripe. Cards or payments saved in Square (or other processors) are not linked to this parent portal unless the same card was added in Stripe.";

  const user = await User.findById(userId).select("stripeCustomerId email").lean();
  const linked = await ensureStripeSubscriptionLinked(userId);
  const portalStatus = linked.record?.status ?? "none";
  const stripeSub = linked.stripeSubscription;
  const stripe = getStripe();

  let paymentMethodOnFile = false;
  let latestInvoiceStatus: string | null = null;
  let latestInvoiceAmountDueCents: number | null = null;
  let lastPaymentError: string | null = null;

  if (stripe && user?.stripeCustomerId) {
    try {
      const customer = await stripe.customers.retrieve(user.stripeCustomerId);
      if (!customer.deleted) {
        const defaultPm = customer.invoice_settings?.default_payment_method;
        paymentMethodOnFile = !!defaultPm;
        if (!paymentMethodOnFile) {
          const methods = await stripe.paymentMethods.list({
            customer: user.stripeCustomerId,
            type: "card",
            limit: 1,
          });
          paymentMethodOnFile = methods.data.length > 0;
        }
      }
    } catch {
      // ignore
    }
  }

  if (stripe && stripeSub?.latest_invoice) {
    try {
      const invoiceId =
        typeof stripeSub.latest_invoice === "string"
          ? stripeSub.latest_invoice
          : stripeSub.latest_invoice.id;
      const invoice = await stripe.invoices.retrieve(invoiceId, {
        expand: ["payment_intent"],
      });
      latestInvoiceStatus = invoice.status ?? null;
      latestInvoiceAmountDueCents = invoice.amount_due ?? null;
      const pi = (invoice as Stripe.Invoice & { payment_intent?: Stripe.PaymentIntent | string })
        .payment_intent;
      if (typeof pi === "object" && pi?.last_payment_error?.message) {
        lastPaymentError = pi.last_payment_error.message;
      } else if (invoice.last_finalization_error?.message) {
        lastPaymentError = invoice.last_finalization_error.message;
      }
    } catch {
      // ignore
    }
  }

  const stripeStatus = mapStripeStatus(stripeSub?.status);
  const { statusLabel, statusDetail } = buildStatusDetail({
    stripeStatus,
    portalStatus,
    paymentMethodOnFile,
    latestInvoiceStatus,
    lastPaymentError,
    cancelAtPeriodEnd: stripeSub?.cancel_at_period_end ?? linked.record?.cancelAtPeriodEnd ?? false,
    hasStripeSubscription: !!stripeSub,
  });

  const periodEnd = stripeSub
    ? (stripeSub as Stripe.Subscription & { current_period_end?: number }).current_period_end
    : undefined;

  let membershipInvoices: StripeMembershipInvoiceRow[] = [];
  if (stripe && user?.stripeCustomerId) {
    try {
      membershipInvoices = await listMembershipInvoices(stripe, user.stripeCustomerId);
    } catch {
      membershipInvoices = [];
    }
  }

  return {
    portalStatus,
    stripeStatus,
    statusLabel,
    statusDetail,
    paymentMethodOnFile,
    stripeCustomerId: user?.stripeCustomerId ?? null,
    stripeSubscriptionId: stripeSub?.id ?? linked.stripeSubscriptionId ?? null,
    latestInvoiceStatus,
    latestInvoiceAmountDueCents,
    lastPaymentError,
    cancelAtPeriodEnd: stripeSub?.cancel_at_period_end ?? false,
    stripePeriodEnd: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
    externalPaymentsNote,
    membershipInvoices,
  };
}
