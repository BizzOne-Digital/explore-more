import { sendTransactionalEmail, wrapEmailTemplate } from "@/lib/services/email";
import { getAdminEmail } from "@/lib/email/get-admin-email";

export interface ProgramBookingEmailData {
  requestId: string;
  parentName: string;
  email: string;
  phone: string;
  studentName: string;
  studentAge?: string;
  preferredSchedule?: string;
  requestType: "individual" | "group";
  schoolStatus?: "homeschool" | "traditional" | "other";
  goals?: string;
  accessibilityNeeds?: string;
  additionalNotes?: string;
}

export interface ProgramEmailData {
  title: string;
  slug?: string;
  schedule?: string;
  ageRange?: string;
  shortDescription?: string;
}

function requestTypeLabel(type: "individual" | "group"): string {
  return type === "group" ? "Group" : "Individual";
}

function schoolStatusLabel(status?: string): string | null {
  if (!status) return null;
  if (status === "homeschool") return "Homeschool";
  if (status === "traditional") return "Traditional School";
  return "Other";
}

function optionalRow(label: string, value?: string | null): string {
  if (!value?.trim()) return "";
  return `<p style="margin:0 0 6px"><strong>${label}:</strong> ${value}</p>`;
}

export async function sendProgramBookingEmails({
  booking,
  program,
}: {
  booking: ProgramBookingEmailData;
  program: ProgramEmailData;
}): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.exploremoreacademy.com";
  const programUrl = program.slug ? `${appUrl}/programs/${program.slug}` : `${appUrl}/programs`;

  await sendTransactionalEmail({
    to: booking.email,
    subject: `Program Request Received — ${program.title}`,
    template: "programBookingConfirmation",
    htmlBody: wrapEmailTemplate(`
      <h2 style="color:#101315">We received your request!</h2>
      <p>Hi ${booking.parentName}, thank you for your interest in <strong>${program.title}</strong>. Our team will contact you within 2 business days.</p>
      ${program.shortDescription ? `<p style="color:#555">${program.shortDescription}</p>` : ""}
      <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:20px 0">
        <p style="margin:0 0 8px"><strong>Request ID:</strong> ${booking.requestId}</p>
        <p style="margin:0 0 8px"><strong>Student:</strong> ${booking.studentName}${booking.studentAge ? ` (age ${booking.studentAge})` : ""}</p>
        <p style="margin:0 0 8px"><strong>Request Type:</strong> ${requestTypeLabel(booking.requestType)}</p>
        ${optionalRow("Preferred Schedule", booking.preferredSchedule)}
        ${program.schedule ? `<p style="margin:0 0 8px"><strong>Program Schedule:</strong> ${program.schedule}</p>` : ""}
        ${program.ageRange ? `<p style="margin:0"><strong>Age Range:</strong> ${program.ageRange}</p>` : ""}
      </div>
      <p><a href="${programUrl}" style="display:inline-block;background:#ff5a16;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">View Program</a></p>
      <p style="margin-top:20px;font-size:14px;color:#666">Questions? Contact us at ${getAdminEmail()}.</p>
    `),
    textBody: `Your request for ${program.title} was received. Request ID: ${booking.requestId}. We will contact you within 2 business days.`,
  });

  await sendTransactionalEmail({
    to: getAdminEmail(),
    subject: `New Program Request — ${program.title}`,
    template: "adminProgramBooking",
    htmlBody: wrapEmailTemplate(`
      <h2 style="color:#101315">New program request</h2>
      <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0">
        <p style="margin:0 0 6px"><strong>Program:</strong> ${program.title}</p>
        <p style="margin:0 0 6px"><strong>Request ID:</strong> ${booking.requestId}</p>
        <p style="margin:0 0 6px"><strong>Request Type:</strong> ${requestTypeLabel(booking.requestType)}</p>
        ${program.ageRange ? `<p style="margin:0 0 6px"><strong>Age Range:</strong> ${program.ageRange}</p>` : ""}
        ${program.schedule ? `<p style="margin:0"><strong>Program Schedule:</strong> ${program.schedule}</p>` : ""}
      </div>
      <h3 style="font-size:16px;color:#101315">Parent / Guardian</h3>
      <p style="font-size:14px;color:#444;margin:0 0 4px"><strong>Name:</strong> ${booking.parentName}</p>
      <p style="font-size:14px;color:#444;margin:0 0 4px"><strong>Email:</strong> <a href="mailto:${booking.email}">${booking.email}</a></p>
      <p style="font-size:14px;color:#444;margin:0 0 4px"><strong>Phone:</strong> ${booking.phone}</p>
      <h3 style="font-size:16px;color:#101315;margin-top:16px">Student</h3>
      <p style="font-size:14px;color:#444;margin:0 0 4px"><strong>Name:</strong> ${booking.studentName}</p>
      ${booking.studentAge ? `<p style="font-size:14px;color:#444;margin:0 0 4px"><strong>Age:</strong> ${booking.studentAge}</p>` : ""}
      ${optionalRow("Preferred Schedule", booking.preferredSchedule)}
      ${optionalRow("School Status", schoolStatusLabel(booking.schoolStatus))}
      ${optionalRow("Goals", booking.goals)}
      ${optionalRow("Accessibility Needs", booking.accessibilityNeeds)}
      ${optionalRow("Additional Notes", booking.additionalNotes)}
      <p style="margin-top:20px">
        <a href="${appUrl}/admin/service-requests" style="display:inline-block;background:#0c8991;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">View Requests in Admin</a>
      </p>
    `),
    textBody: `New program request for ${program.title}: ${booking.parentName} (${booking.email}), student ${booking.studentName}. Request ID: ${booking.requestId}.`,
  });
}
