import { sendTransactionalEmail, wrapEmailTemplate } from "@/lib/services/email";
import { getAdminEmail } from "@/lib/email/get-admin-email";

export interface EventRegistrationEmailData {
  registrationId: string;
  studentName: string;
  guardianName: string;
  guardianEmail: string;
  guardianPhone?: string;
  paymentStatus: string;
  paymentAmount?: number;
  status: string;
  lineItems?: Array<{
    name: string;
    quantity: number;
    priceAmount: number;
  }>;
}

export interface EventEmailData {
  title: string;
  slug?: string;
  startDate: Date | string;
  endDate: Date | string;
  startTime: string;
  endTime: string;
  location: string;
  isOnline?: boolean;
}

export async function sendAdminEventRegistrationNotification({
  registration,
  event,
}: {
  registration: EventRegistrationEmailData;
  event: EventEmailData;
}): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.exploremoreacademy.com";
  const startDate = new Date(event.startDate).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const paymentLine =
    registration.paymentStatus === "paid"
      ? `Paid${registration.paymentAmount != null ? ` ($${registration.paymentAmount.toFixed(2)})` : ""}`
      : registration.paymentStatus === "free"
        ? "Free event"
        : registration.paymentStatus;

  await sendTransactionalEmail({
    to: getAdminEmail(),
    subject: `New Event Registration — ${event.title}`,
    template: "adminEventRegistration",
    htmlBody: wrapEmailTemplate(`
      <h2 style="color:#101315">New event registration</h2>
      <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0">
        <p style="margin:0 0 6px"><strong>Event:</strong> ${event.title}</p>
        <p style="margin:0 0 6px"><strong>Date:</strong> ${startDate}</p>
        <p style="margin:0 0 6px"><strong>Time:</strong> ${event.startTime} – ${event.endTime}</p>
        <p style="margin:0 0 6px"><strong>Location:</strong> ${event.isOnline ? "Online" : event.location}</p>
        <p style="margin:0"><strong>Confirmation #:</strong> ${registration.registrationId}</p>
      </div>
      <h3 style="font-size:16px;color:#101315">Registrant</h3>
      <p style="font-size:14px;color:#444;margin:0 0 4px"><strong>Student:</strong> ${registration.studentName}</p>
      <p style="font-size:14px;color:#444;margin:0 0 4px"><strong>Guardian:</strong> ${registration.guardianName}</p>
      <p style="font-size:14px;color:#444;margin:0 0 4px"><strong>Email:</strong> <a href="mailto:${registration.guardianEmail}">${registration.guardianEmail}</a></p>
      ${registration.guardianPhone ? `<p style="font-size:14px;color:#444;margin:0 0 4px"><strong>Phone:</strong> ${registration.guardianPhone}</p>` : ""}
      <p style="font-size:14px;color:#444;margin:0 0 4px"><strong>Status:</strong> ${registration.status}</p>
      <p style="font-size:14px;color:#444;margin:0 0 4px"><strong>Payment:</strong> ${paymentLine}</p>
      ${
        registration.lineItems?.length
          ? `<h3 style="font-size:16px;color:#101315;margin-top:16px">Packages</h3>
      <ul style="font-size:14px;color:#444;padding-left:18px;margin:8px 0 0">
        ${registration.lineItems
          .map(
            (item) =>
              `<li>${item.name} × ${item.quantity} — $${(item.priceAmount * item.quantity).toFixed(2)}</li>`
          )
          .join("")}
      </ul>`
          : ""
      }
      <p style="margin-top:20px">
        <a href="${appUrl}/admin/event-registrations" style="display:inline-block;background:#0c8991;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">View Registrations in Admin</a>
      </p>
    `),
    textBody: `New registration for ${event.title}: ${registration.studentName} (${registration.guardianEmail}). Confirmation ${registration.registrationId}.`,
  });
}
