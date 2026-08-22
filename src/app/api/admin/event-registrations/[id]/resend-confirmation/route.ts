import connectDB from "@/lib/db";
import { EventRegistration, Event } from "@/models";
import { apiSuccess, apiError, notFound, isValidObjectId } from "@/lib/admin/api";
import { sendAdminEventRegistrationNotification } from "@/lib/email/admin-notifications";
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

    await sendAdminEventRegistrationNotification({
      registration: {
        registrationId: registration.registrationId,
        studentName: registration.studentName,
        guardianName: registration.guardianName,
        guardianEmail: registration.guardianEmail,
        guardianPhone: registration.guardianPhone,
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
      },
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
