import Stripe from "stripe";
import connectDB from "@/lib/db";
import {
  EventRegistration,
  User,
  Order,
  Book,
  Enrollment,
  Donation,
  DonationCampaign,
} from "@/models";
import { constructWebhookEvent } from "@/lib/services/stripe";
import { queueEmail, emailTemplates } from "@/lib/services/email";
import { formatCents } from "@/lib/utils";

export const runtime = "nodejs";

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const checkoutType = session.metadata?.checkoutType;
  if (!checkoutType) return;

  await connectDB();

  switch (checkoutType) {
    case "books": {
      const orderId = session.metadata?.orderId;
      if (!orderId) return;

      const order = await Order.findById(orderId);
      if (!order || order.paymentStatus === "paid") return;

      order.paymentStatus = "paid";
      order.stripeSessionId = session.id;
      order.stripePaymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
      await order.save();

      for (const item of order.items) {
        await Book.findByIdAndUpdate(item.bookId, {
          $inc: { inventory: -item.quantity },
        });
      }

      const template = emailTemplates.orderConfirmation(
        order.customerName,
        order.orderNumber,
        formatCents(order.totalCents)
      );
      await queueEmail({
        to: order.customerEmail,
        subject: template.subject,
        htmlBody: template.html,
        template: "orderConfirmation",
        metadata: { orderId: order._id.toString() },
      });
      break;
    }

    case "course": {
      const enrollmentId = session.metadata?.enrollmentId;
      if (!enrollmentId) return;

      const enrollment = await Enrollment.findById(enrollmentId).populate("courseId");
      if (!enrollment || enrollment.paymentStatus === "paid") return;

      enrollment.paymentStatus = "paid";
      enrollment.stripeSessionId = session.id;
      enrollment.status = "active";
      await enrollment.save();

      const course = enrollment.courseId as { title?: string } | null;
      const user = await User.findById(enrollment.userId);
      if (user && course?.title) {
        const template = emailTemplates.enrollmentConfirmation(user.name, course.title);
        await queueEmail({
          to: user.email,
          subject: template.subject,
          htmlBody: template.html,
          template: "enrollmentConfirmation",
          metadata: { enrollmentId: enrollment._id.toString() },
        });
      }
      break;
    }

    case "event": {
      const registrationId = session.metadata?.registrationId;
      if (!registrationId) return;

      const registration = await EventRegistration.findById(registrationId).populate("eventId");
      if (!registration || registration.paymentStatus === "paid") return;

      registration.paymentStatus = "paid";
      registration.stripeSessionId = session.id;
      await registration.save();

      const event = registration.eventId as { title?: string; startDate?: Date } | null;
      const user = await User.findById(registration.userId);
      if (user && event?.title) {
        const dateStr = event.startDate
          ? new Date(event.startDate).toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })
          : "TBD";
        const template = emailTemplates.eventRegistration(user.name, event.title, dateStr);
        await queueEmail({
          to: user.email,
          subject: template.subject,
          htmlBody: template.html,
          template: "eventRegistration",
          metadata: { registrationId: registration._id.toString() },
        });
      }
      break;
    }

    case "donation": {
      const donationId = session.metadata?.donationId;
      if (!donationId) return;

      const donation = await Donation.findById(donationId).populate("campaignId");
      if (!donation || donation.paymentStatus === "paid") return;

      donation.paymentStatus = "paid";
      donation.stripeSessionId = session.id;
      donation.stripePaymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id;
      await donation.save();

      await DonationCampaign.findByIdAndUpdate(donation.campaignId, {
        $inc: { raisedCents: donation.amountCents },
      });

      const campaign = donation.campaignId as { title?: string } | null;
      if (!donation.receiptSent) {
        const template = emailTemplates.donationConfirmation(
          donation.donorName,
          formatCents(donation.amountCents),
          campaign?.title ?? "Explore More Academy"
        );
        await queueEmail({
          to: donation.donorEmail,
          subject: template.subject,
          htmlBody: template.html,
          template: "donationConfirmation",
          metadata: { donationId: donation._id.toString() },
        });
        donation.receiptSent = true;
        await donation.save();
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
    if (session.payment_status === "paid") {
      await handleCheckoutCompleted(session);
    }
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
