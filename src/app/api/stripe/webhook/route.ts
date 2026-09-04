import Stripe from "stripe";
import connectDB from "@/lib/db";
import {
  EventRegistration,
  User,
  Enrollment,
  Donation,
  DonationCampaign,
} from "@/models";
import { constructWebhookEvent, getStripe } from "@/lib/services/stripe";
import {
  activateMembershipForUser,
  savePendingMembership,
} from "@/lib/billing/membership-activation";
import { syncSubscriptionFromStripe } from "@/lib/billing/subscription-management";
import {
  expiredCheckoutReason,
  asyncPaymentFailedReason,
  handleCheckoutPaymentFailure,
  handleInvoicePaymentFailed,
  paymentIntentFailedReason,
  resolveCheckoutSessionFromPaymentIntent,
} from "@/lib/billing/payment-failure";

import { sendEventRegistrationEmails } from "@/lib/email/event-notifications";
import { sendCourseEnrollmentEmails } from "@/lib/email/course-notifications";
import { sendDonationEmails } from "@/lib/email/donation-notifications";
import { upsertSponsorFromDonation } from "@/lib/sponsors/sync";
import { getCampaignGoalCents, getCampaignRaisedCents } from "@/lib/pricing";
import { fulfillBookOrder } from "@/lib/orders/fulfill-book-order";

export const runtime = "nodejs";

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const metadata = session.metadata ?? {};
  const checkoutType =
    metadata.checkoutType ||
    (metadata.type === "order" ? "books" : undefined) ||
    (metadata.type === "enrollment" ? "course" : undefined) ||
    (metadata.type === "donation" ? "donation" : undefined);
  if (!checkoutType) return;

  await connectDB();

  switch (checkoutType) {
    case "books": {
      const orderId = session.metadata?.orderId;
      if (!orderId) return;
      await fulfillBookOrder(orderId, session);
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
      if (!enrollment || enrollment.paymentStatus === "paid") return;

      enrollment.paymentStatus = "paid";
      enrollment.stripeSessionId = session.id;
      enrollment.status = "active";
      await enrollment.save();

      const courseDoc = enrollment.courseId as {
        title?: string;
        slug?: string;
        instructor?: string;
        schedule?: string;
        deliveryFormat?: string;
        shortDescription?: string;
        priceAmount?: number;
        isFree?: boolean;
      } | null;
      const user = await User.findById(enrollment.userId);

      if (user && courseDoc?.title) {
        try {
          const priceCents = courseDoc.isFree || !courseDoc.priceAmount
            ? 0
            : Math.round(courseDoc.priceAmount * 100);

          await sendCourseEnrollmentEmails({
            enrollment: {
              enrollmentId: enrollment._id.toString(),
              studentName: user.name,
              studentEmail: user.email,
              paymentStatus: "paid",
              priceCents,
              status: enrollment.status,
            },
            course: {
              title: courseDoc.title,
              slug: courseDoc.slug,
              instructor: courseDoc.instructor,
              schedule: courseDoc.schedule,
              deliveryFormat: courseDoc.deliveryFormat,
              shortDescription: courseDoc.shortDescription,
            },
          });
        } catch (err) {
          console.error("Paid course enrollment emails failed:", err);
        }
      }
      break;
    }

    case "event": {
      const registrationId = session.metadata?.registrationId;
      if (!registrationId) return;

      const registration = await EventRegistration.findById(registrationId).populate("eventId");
      if (!registration || registration.paymentStatus === "paid") return;

      registration.paymentStatus = "paid";
      registration.status = "confirmed";
      registration.stripeSessionId = session.id;
      await registration.save();

      const eventDoc = registration.eventId as {
        title?: string;
        slug?: string;
        startDate?: Date;
        endDate?: Date;
        startTime?: string;
        endTime?: string;
        location?: string;
        isOnline?: boolean;
        instructions?: string;
        contactName?: string;
        contactEmail?: string;
        contactPhone?: string;
      } | null;

      if (eventDoc?.title) {
        try {
          await sendEventRegistrationEmails({
            registration: {
              registrationId: registration.registrationId,
              studentName: registration.studentName,
              guardianName: registration.guardianName,
              guardianEmail: registration.guardianEmail,
              guardianPhone: registration.guardianPhone,
              paymentStatus: registration.paymentStatus,
              paymentAmount: registration.paymentAmount,
              status: registration.status,
              lineItems: registration.lineItems?.map((item) => ({
                name: item.name,
                quantity: item.quantity,
                priceAmount: item.priceAmount,
              })),
            },
            event: {
              title: eventDoc.title,
              slug: eventDoc.slug,
              startDate: eventDoc.startDate ?? new Date(),
              endDate: eventDoc.endDate ?? new Date(),
              startTime: eventDoc.startTime ?? "",
              endTime: eventDoc.endTime ?? "",
              location: eventDoc.location ?? "",
              isOnline: eventDoc.isOnline,
              instructions: eventDoc.instructions,
              contactName: eventDoc.contactName,
              contactEmail: eventDoc.contactEmail,
              contactPhone: eventDoc.contactPhone,
            },
          });

          await EventRegistration.findByIdAndUpdate(registration._id, {
            confirmationEmailSent: true,
            confirmationEmailSentAt: new Date(),
          });
        } catch (err) {
          console.error("Paid event registration emails failed:", err);
        }
      }
      break;
    }

    case "membership": {
      const planId = session.metadata?.planId;
      const planSlug = session.metadata?.planSlug;
      const userId = session.metadata?.userId;
      const email = (
        session.customer_email ||
        session.customer_details?.email ||
        ""
      ).toLowerCase();
      const customerName =
        session.customer_details?.name ||
        session.metadata?.customerName ||
        "Member";
      const stripeSubscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription?.id;
      const stripeCustomerId =
        typeof session.customer === "string" ? session.customer : session.customer?.id;

      if (!planId || !stripeSubscriptionId) return;

      let currentPeriodEnd: Date | undefined;
      const stripe = getStripe();
      if (stripe) {
        const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
        const periodEnd = (subscription as unknown as { current_period_end?: number }).current_period_end;
        if (periodEnd) {
          currentPeriodEnd = new Date(periodEnd * 1000);
        }
      }

      const stripePriceId =
        typeof session.metadata?.stripePriceId === "string"
          ? session.metadata.stripePriceId
          : undefined;

      let targetUserId = userId;
      if (!targetUserId && email) {
        const user = await User.findOne({ email });
        targetUserId = user?._id?.toString();
      }

      if (targetUserId) {
        await activateMembershipForUser({
          userId: targetUserId,
          planId,
          stripeSubscriptionId,
          stripePriceId,
          stripeCustomerId,
          currentPeriodEnd,
          status: "active",
        });
        if (email) {
          const { PendingMembership } = await import("@/models");
          await PendingMembership.deleteOne({ email });
        }
      } else if (email) {
        await savePendingMembership({
          email,
          planId,
          stripeSubscriptionId,
          stripeCustomerId,
          stripePriceId,
          currentPeriodEnd,
        });
      }

      if (email) {
        try {
          const { SubscriptionPlan } = await import("@/models");
          const plan = await SubscriptionPlan.findById(planId).lean();
          const amountCents = session.amount_total ?? plan?.priceCents ?? 0;
          const priceLabel = `$${(amountCents / 100).toFixed(2)}`;
          const { sendMembershipPurchaseEmails } = await import(
            "@/lib/email/membership-notifications"
          );
          await sendMembershipPurchaseEmails({
            customerName: String(customerName),
            customerEmail: email,
            planName: plan?.name ?? planSlug ?? "Membership",
            priceLabel,
            interval: plan?.interval === "year" ? "year" : "month",
          });
        } catch (err) {
          console.error("Membership purchase emails failed:", err);
        }
      }
      break;
    }

    case "donation": {
      const donationId = session.metadata?.donationId;
      if (!donationId) return;

      const donation = await Donation.findById(donationId).populate("campaignId").populate("programId");
      if (!donation || donation.paymentStatus === "paid") return;

      donation.paymentStatus = "paid";
      donation.stripeSessionId = session.id;
      donation.stripePaymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
      await donation.save();

      if (donation.campaignId) {
        await DonationCampaign.findByIdAndUpdate(donation.campaignId, {
          $inc: { raisedAmount: donation.amountCents / 100 },
        });
      }

      try {
        await upsertSponsorFromDonation({
          donorEmail: donation.donorEmail,
          donorName: donation.donorName,
          amountCents: donation.amountCents,
          isAnonymous: donation.isAnonymous,
          userId: donation.userId?.toString(),
          donatedAt: donation.createdAt,
        });
      } catch (err) {
        console.error("Sponsor CRM sync failed:", err);
      }

      const campaign = donation.campaignId as {
        title?: string;
        slug?: string;
        goalAmount?: number;
        raisedAmount?: number;
      } | null;

      const program = donation.programId as { title?: string; slug?: string } | null;
      const receiptTitle = campaign?.title
        ? campaign.title
        : program?.title
          ? `Program: ${program.title}`
          : "Explore More Academy";
      const receiptSlug = campaign?.slug ?? program?.slug;

      if (!donation.receiptSent) {
        try {
          await sendDonationEmails({
            donation: {
              donationId: donation._id.toString(),
              donorName: donation.donorName,
              donorEmail: donation.donorEmail,
              amountCents: donation.amountCents,
              isAnonymous: donation.isAnonymous,
              message: donation.message,
            },
            campaign: {
              title: receiptTitle,
              slug: receiptSlug,
              goalCents: campaign?.goalAmount != null ? getCampaignGoalCents({ goalAmount: campaign.goalAmount }) : undefined,
              raisedCents: campaign?.raisedAmount != null ? getCampaignRaisedCents({ raisedAmount: campaign.raisedAmount }) : undefined,
            },
          });
          donation.receiptSent = true;
          await donation.save();
        } catch (err) {
          console.error("Donation emails failed:", err);
        }
      }
      break;
    }
  }
}

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const body = await request.text();

  let event: Stripe.Event;
  try {
    event = constructWebhookEvent(body, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook verification failed";
    return new Response(message, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    if (session.payment_status === "paid" || session.mode === "subscription") {
      await handleCheckoutCompleted(session);
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleCheckoutPaymentFailure(session, expiredCheckoutReason());
  }

  if (event.type === "checkout.session.async_payment_failed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await handleCheckoutPaymentFailure(session, asyncPaymentFailedReason());
  }

  if (event.type === "payment_intent.payment_failed") {
    const paymentIntent = event.data.object as Stripe.PaymentIntent;
    const session = await resolveCheckoutSessionFromPaymentIntent(paymentIntent);
    if (session) {
      await handleCheckoutPaymentFailure(session, paymentIntentFailedReason(paymentIntent));
    }
  }

  if (event.type === "invoice.payment_failed") {
    const invoice = event.data.object as Stripe.Invoice;
    await handleInvoicePaymentFailed(invoice);
  }

  if (
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  ) {
    await connectDB();
    const subscription = event.data.object as Stripe.Subscription;
    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id;

    if (customerId) {
      const user = await User.findOne({ stripeCustomerId: customerId }).select("_id").lean();
      if (user?._id) {
        await syncSubscriptionFromStripe(user._id.toString(), subscription);
      }
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
