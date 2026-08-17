import connectDB from "@/lib/db";
import { EventRegistration, Event } from "@/models";
import { apiSuccess, apiError, notFound, isValidObjectId } from "@/lib/admin/api";
import { sendRegistrationConfirmation } from "@/lib/email/templates/registration-confirmation";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return notFound();
    
    await connectDB();
    const registration = await EventRegistration.findById(id).lean();
    if (!registration) return notFound();

    const event = await Event.findById(registration.eventId).lean();
    if (!event) return apiError("Event not found");

    // Send confirmation email
    await sendRegistrationConfirmation({
      registration,
      event,
    });

    // Update registration to mark email sent
    await EventRegistration.findByIdAndUpdate(id, {
      confirmationEmailSent: true,
      confirmationEmailSentAt: new Date(),
    });

    return apiSuccess({ sent: true });
  } catch (error) {
    return apiError(error);
  }
}
