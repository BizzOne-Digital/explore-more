import connectDB from "@/lib/db";
import { Event, EventRegistration } from "@/models";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireSession } from "@/lib/api/auth-helpers";
import { getEventPriceCents } from "@/lib/pricing";
import { sendEventRegistrationEmails } from "@/lib/email/event-notifications";
import { z } from "zod";

const registerSchema = z.object({
  studentName: z.string().min(1),
  studentAge: z.number().int().optional(),
  guardianName: z.string().optional(),
  guardianEmail: z.string().email().optional(),
  guardianPhone: z.string().optional(),
  consentGiven: z.boolean(),
  notes: z.string().max(500).optional(),
});

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: RouteContext) {
  const sessionResult = await requireSession();
  if ("error" in sessionResult) return sessionResult.error;

  const { slug } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  if (!parsed.data.consentGiven) {
    return jsonError("Consent is required to register");
  }

  await connectDB();

  const event = await Event.findOne({
    slug,
    status: "published",
    registrationEnabled: true,
  });

  if (!event) {
    return jsonError("Event not found or registration is closed", 404);
  }

  if (event.registrationDeadline && new Date() > event.registrationDeadline) {
    return jsonError("Registration deadline has passed", 400);
  }

  if (getEventPriceCents(event) > 0) {
    return jsonError("This is a paid event. Use checkout instead.", 400);
  }

  const existing = await EventRegistration.findOne({
    eventId: event._id,
    userId: sessionResult.user.id,
  });

  if (existing) {
    return jsonError("You are already registered for this event", 409);
  }

  const guardianName = parsed.data.guardianName || sessionResult.user.name;
  const guardianEmail = parsed.data.guardianEmail || sessionResult.user.email;
  const guardianPhone = parsed.data.guardianPhone || "N/A";

  const registration = await EventRegistration.create({
    eventId: event._id,
    userId: sessionResult.user.id,
    registrationId: `REG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    studentName: parsed.data.studentName,
    studentAge: parsed.data.studentAge,
    guardianName,
    guardianEmail,
    guardianPhone,
    registrationType: "free",
    paymentStatus: "free",
    status: "confirmed",
    notes: parsed.data.notes,
  });

  try {
    await sendEventRegistrationEmails({
      registration: {
        registrationId: registration.registrationId,
        studentName: registration.studentName,
        guardianName,
        guardianEmail,
        guardianPhone,
        paymentStatus: registration.paymentStatus,
        paymentAmount: registration.paymentAmount,
        status: registration.status,
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

    await EventRegistration.findByIdAndUpdate(registration._id, {
      confirmationEmailSent: true,
      confirmationEmailSentAt: new Date(),
    });
  } catch (err) {
    console.error("Event registration emails failed:", err);
  }

  return jsonOk(
    { message: "Successfully registered for event", registrationId: registration._id.toString() },
    201
  );
}
