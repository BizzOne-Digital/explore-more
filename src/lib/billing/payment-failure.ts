import type Stripe from "stripe";
import connectDB from "@/lib/db";
import {
  Donation,
  Enrollment,
  EventRegistration,
  Order,
  SubscriptionPlan,
} from "@/models";
import {
  sendPaymentFailureEmail,
  type PaymentCheckoutType,
} from "@/lib/email/payment-failure-notifications";
import { getStripe } from "@/lib/services/stripe";

function resolveCheckoutType(session: Stripe.Checkout.Session): PaymentCheckoutType | null {
  const metadata = session.metadata ?? {};
  const checkoutType =
    metadata.checkoutType ||
    (metadata.type === "order" ? "books" : undefined) ||
    (metadata.type === "enrollment" ? "course" : undefined) ||
    (metadata.type === "donation" ? "donation" : undefined);

  if (
    checkoutType === "books" ||
    checkoutType === "course" ||
    checkoutType === "event" ||
    checkoutType === "membership" ||
    checkoutType === "donation"
  ) {
    return checkoutType;
  }
  return null;
}

function sessionCustomerEmail(session: Stripe.Checkout.Session): string {
  return (
    session.customer_email ||
    session.customer_details?.email ||
    ""
  ).toLowerCase();
}

function sessionCustomerName(session: Stripe.Checkout.Session): string {
  return session.customer_details?.name || "Customer";
}

function humanizeStripeError(message?: string | null): string {
  if (!message) {
    return "Your payment could not be processed. Please check your card details or try a different payment method.";
  }
  return message;
}

export async function resolveCheckoutSessionFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent
): Promise<Stripe.Checkout.Session | null> {
  const stripe = getStripe();
  if (!stripe) return null;

  const sessions = await stripe.checkout.sessions.list({
    payment_intent: paymentIntent.id,
    limit: 1,
  });
  return sessions.data[0] ?? null;
}

export async function handleCheckoutPaymentFailure(
  session: Stripe.Checkout.Session,
  reason: string
): Promise<void> {
  const checkoutType = resolveCheckoutType(session);
  if (!checkoutType) return;

  await connectDB();

  let customerEmail = sessionCustomerEmail(session);
  let customerName = sessionCustomerName(session);
  let itemLabel: string | undefined;
  let amountCents = session.amount_total ?? undefined;
  let reference: string | undefined;
  let shouldEmail = false;

  switch (checkoutType) {
    case "books": {
      const orderId = session.metadata?.orderId;
      if (!orderId) return;
      const order = await Order.findById(orderId);
      if (!order || order.paymentStatus === "paid" || order.paymentStatus === "failed") return;

      order.paymentStatus = "failed";
      order.stripeSessionId = session.id;
      await order.save();

      customerEmail = order.customerEmail;
      customerName = order.customerName;
      itemLabel = order.items.map((item) => item.title).join(", ");
      amountCents = order.totalCents;
      reference = order.orderNumber;
      shouldEmail = true;
      break;
    }

    case "course": {
      let enrollmentId = session.metadata?.enrollmentId;
      if (!enrollmentId && session.metadata?.courseId && session.metadata?.userId) {
        const existing = await Enrollment.findOne({
          courseId: session.metadata.courseId,
          userId: session.metadata.userId,
        });
        enrollmentId = existing?._id?.toString();
      }
      if (!enrollmentId) return;

      const enrollment = await Enrollment.findById(enrollmentId).populate("courseId");
      if (!enrollment || enrollment.paymentStatus === "paid" || enrollment.paymentStatus === "failed") {
        return;
      }

      enrollment.paymentStatus = "failed";
      enrollment.stripeSessionId = session.id;
      await enrollment.save();

      const course = enrollment.courseId as { title?: string } | null;
      const { User } = await import("@/models");
      const user = await User.findById(enrollment.userId).lean();

      customerEmail = user?.email ?? customerEmail;
      customerName = user?.name ?? customerName;
      itemLabel = course?.title;
      shouldEmail = Boolean(customerEmail);
      break;
    }

    case "event": {
      const registrationId = session.metadata?.registrationId;
      if (!registrationId) return;

      const registration = await EventRegistration.findById(registrationId).populate("eventId");
      if (!registration || registration.paymentStatus === "paid" || registration.paymentStatus === "failed") {
        return;
      }

      registration.paymentStatus = "failed";
      registration.stripeSessionId = session.id;
      await registration.save();

      const event = registration.eventId as { title?: string } | null;
      customerEmail = registration.guardianEmail;
      customerName = registration.guardianName;
      itemLabel = event?.title;
      reference = registration.registrationId;
      amountCents =
        registration.paymentAmount != null
          ? Math.round(registration.paymentAmount * 100)
          : amountCents;
      shouldEmail = true;
      break;
    }

    case "membership": {
      const planId = session.metadata?.planId;
      const planSlug = session.metadata?.planSlug;
      if (planId) {
        const plan = await SubscriptionPlan.findById(planId).lean();
        itemLabel = plan?.name ?? planSlug ?? "Membership";
      } else {
        itemLabel = planSlug ?? "Membership";
      }
      shouldEmail = Boolean(customerEmail);
      break;
    }

    case "donation": {
      const donationId = session.metadata?.donationId;
      if (!donationId) return;

      const donation = await Donation.findById(donationId).populate("campaignId");
      if (!donation || donation.paymentStatus === "paid" || donation.paymentStatus === "failed") {
        return;
      }

      donation.paymentStatus = "failed";
      donation.stripeSessionId = session.id;
      await donation.save();

      const campaign = donation.campaignId as { title?: string } | null;
      customerEmail = donation.donorEmail;
      customerName = donation.donorName;
      itemLabel = campaign?.title ?? "Donation";
      amountCents = donation.amountCents;
      reference = donation._id.toString();
      shouldEmail = true;
      break;
    }
  }

  if (!shouldEmail || !customerEmail) return;

  try {
    await sendPaymentFailureEmail({
      customerName,
      customerEmail,
      checkoutType,
      reason,
      itemLabel,
      amountCents: amountCents ?? undefined,
      reference,
    });
  } catch (error) {
    console.error("Payment failure email failed:", error);
  }
}

export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  const customerEmail = invoice.customer_email?.toLowerCase();
  if (!customerEmail) return;

  const amountCents = invoice.amount_due ?? undefined;
  const reason =
    humanizeStripeError(invoice.last_finalization_error?.message) ||
    "Your membership renewal payment could not be processed. Please update your payment method to keep your membership active.";

  try {
    await sendPaymentFailureEmail({
      customerName: invoice.customer_name || "Member",
      customerEmail,
      checkoutType: "membership",
      reason,
      itemLabel: "Membership renewal",
      amountCents: amountCents ?? undefined,
      reference: invoice.number ?? invoice.id,
    });
  } catch (error) {
    console.error("Membership renewal failure email failed:", error);
  }
}

export function expiredCheckoutReason(): string {
  return "Your checkout was cancelled or the payment session expired before it could be completed.";
}

export function asyncPaymentFailedReason(): string {
  return "Your payment could not be processed. Please check your card details or try a different payment method.";
}

export function paymentIntentFailedReason(paymentIntent: Stripe.PaymentIntent): string {
  return humanizeStripeError(paymentIntent.last_payment_error?.message);
}
