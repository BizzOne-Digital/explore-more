import { z } from "zod";
import connectDB from "@/lib/db";
import { Event, EventRegistration } from "@/models";
import { createCheckoutSession, getAppUrl, isStripeConfigured } from "@/lib/services/stripe";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth-helpers";
import { getEventPriceCents } from "@/lib/pricing";
import { generateEventRegistrationId } from "@/lib/events/generate-registration-id";

const checkoutSchema = z.object({
  eventSlug: z.string().min(1),
  studentName: z.string().min(1),
  studentAge: z.number().int().optional(),
  guardianName: z.string().optional(),
  guardianEmail: z.string().email().optional(),
  guardianPhone: z.string().optional(),
  consentGiven: z.boolean(),
});

export async function POST(request: Request) {
  const sessionResult = await requireSession();
  if ("error" in sessionResult) return sessionResult.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  if (!parsed.data.consentGiven) {
    return jsonError("Consent is required to register");
  }

  await connectDB();

  const event = await Event.findOne({
    slug: parsed.data.eventSlug,
    status: "published",
    registrationEnabled: true,
  });

  if (!event) {
    return jsonError("Event not found or registration is closed", 404);
  }

  if (event.registrationDeadline && new Date() > event.registrationDeadline) {
    return jsonError("Registration deadline has passed", 400);
  }

  const priceCents = getEventPriceCents(event);
  if (priceCents === 0) {
    return jsonError("This event is free. Use the register endpoint instead.", 400);
  }

  const existing = await EventRegistration.findOne({
    eventId: event._id,
    userId: sessionResult.user.id,
  });

  if (existing) {
    return jsonError("You are already registered for this event", 409);
  }

  if (!isStripeConfigured()) {
    return jsonError("Payment system is not configured", 503);
  }

  const guardianName = parsed.data.guardianName || sessionResult.user.name;
  const guardianEmail = parsed.data.guardianEmail || sessionResult.user.email;
  const guardianPhone = parsed.data.guardianPhone || "N/A";

  const registration = await EventRegistration.create({
    eventId: event._id,
    userId: sessionResult.user.id,
    registrationId: generateEventRegistrationId(),
    studentName: parsed.data.studentName,
    studentAge: parsed.data.studentAge,
    guardianName,
    guardianEmail,
    guardianPhone,
    registrationType: "paid",
    paymentStatus: "pending",
    paymentAmount: event.priceAmount,
    status: "pending",
  });

  const appUrl = getAppUrl();
  const session = await createCheckoutSession({
    lineItems: [
      {
        price_data: {
          currency: "usd",
          product_data: { name: event.title, description: event.shortDescription },
          unit_amount: priceCents,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      checkoutType: "event",
      registrationId: registration._id.toString(),
      eventId: event._id.toString(),
    },
    customerEmail: sessionResult.user.email,
    successUrl: `${appUrl}/events/${event.slug}?registered=true&confirmation=${encodeURIComponent(registration.registrationId)}`,
    cancelUrl: `${appUrl}/events/${event.slug}`,
  });

  registration.stripeSessionId = session.id;
  await registration.save();

  return jsonOk({ sessionId: session.id, url: session.url });
}
