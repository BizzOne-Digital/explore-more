import { z } from "zod";
import connectDB from "@/lib/db";
import { Event, EventRegistration } from "@/models";
import { createCheckoutSession, getAppUrl, isStripeConfigured } from "@/lib/services/stripe";
import { jsonOk, jsonError } from "@/lib/api/response";
import { auth } from "@/lib/auth";
import {
  eventHasPackages,
  getEventPackageById,
  getLineItemsTotalCents,
  getPackagePriceCents,
} from "@/lib/events/packages";
import { generateEventRegistrationId } from "@/lib/events/generate-registration-id";
import { sendEventRegistrationEmails } from "@/lib/email/event-notifications";
import { stripeProductData } from "@/lib/stripe/tax-codes";

const checkoutSchema = z.object({
  eventSlug: z.string().min(1),
  items: z
    .array(
      z.object({
        packageId: z.string().min(1),
        quantity: z.number().int().min(1),
      })
    )
    .min(1),
  studentName: z.string().min(1),
  studentAge: z.number().int().optional(),
  guardianName: z.string().min(1),
  guardianEmail: z.string().email(),
  guardianPhone: z.string().min(3),
  consentGiven: z.boolean(),
});

export async function POST(request: Request) {
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
  const session = await auth();

  const event = await Event.findOne({
    slug: parsed.data.eventSlug,
    status: "published",
    registrationEnabled: true,
  });

  if (!event) {
    return jsonError("Event not found or registration is closed", 404);
  }

  if (!eventHasPackages(event)) {
    return jsonError("This event does not offer packages. Use standard event registration.", 400);
  }

  if (event.registrationDeadline && new Date() > event.registrationDeadline) {
    return jsonError("Registration deadline has passed", 400);
  }

  const lineItems = [];
  for (const item of parsed.data.items) {
    const pkg = getEventPackageById(event, item.packageId);
    if (!pkg) {
      return jsonError(`Package not found: ${item.packageId}`, 400);
    }
    lineItems.push({
      packageId: pkg.id,
      name: pkg.name,
      priceAmount: pkg.priceAmount,
      quantity: item.quantity,
      imageUrl: pkg.imageUrl,
      itemType: pkg.itemType,
    });
  }

  const totalCents = getLineItemsTotalCents(lineItems);
  const totalAmount = totalCents / 100;
  const registration = await EventRegistration.create({
    eventId: event._id,
    userId: session?.user?.id,
    registrationId: generateEventRegistrationId(),
    studentName: parsed.data.studentName,
    studentAge: parsed.data.studentAge,
    guardianName: parsed.data.guardianName,
    guardianEmail: parsed.data.guardianEmail,
    guardianPhone: parsed.data.guardianPhone,
    registrationType: totalCents > 0 ? "paid" : "free",
    paymentStatus: totalCents > 0 ? "pending" : "free",
    paymentAmount: totalAmount,
    lineItems,
    status: totalCents > 0 ? "pending" : "confirmed",
  });

  if (totalCents === 0) {
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
          lineItems: registration.lineItems,
        },
        event: {
          title: event.title,
          slug: event.slug,
          startDate: event.startDate,
          endDate: event.endDate,
          startTime: event.startTime,
          endTime: event.endTime,
          location: event.location,
          isOnline: event.isOnline,
          instructions: event.instructions,
          contactName: event.contactName,
          contactEmail: event.contactEmail,
          contactPhone: event.contactPhone,
        },
      });
    } catch (err) {
      console.error("Event registration emails failed:", err);
    }

    return jsonOk({
      registrationId: registration.registrationId,
      success: true,
    });
  }

  if (!isStripeConfigured()) {
    return jsonError("Payment system is not configured", 503);
  }

  const appUrl = getAppUrl();
  const checkoutSession = await createCheckoutSession({
    lineItems: lineItems.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: stripeProductData(
          {
            name: `${event.title} — ${item.name}`,
            description: event.shortDescription,
          },
          "events"
        ),
        unit_amount: getPackagePriceCents(item),
      },
      quantity: item.quantity,
    })),
    mode: "payment",
    metadata: {
      checkoutType: "event",
      registrationId: registration._id.toString(),
      eventId: event._id.toString(),
    },
    customerEmail: parsed.data.guardianEmail,
    managedPayments: false,
    successUrl: `${appUrl}/events/${event.slug}?registered=true&confirmation=${encodeURIComponent(registration.registrationId)}`,
    cancelUrl: `${appUrl}/checkout/events`,
  });

  registration.stripeSessionId = checkoutSession.id;
  await registration.save();

  return jsonOk({
    checkoutUrl: checkoutSession.url,
    registrationId: registration.registrationId,
  });
}
