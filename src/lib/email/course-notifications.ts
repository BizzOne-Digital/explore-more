import { sendTransactionalEmail, wrapEmailTemplate } from "@/lib/services/email";
import { formatCents } from "@/lib/utils";
import { getAdminEmail, getPublicContactEmail } from "@/lib/email/get-admin-email";

export interface CourseEnrollmentEmailData {
  enrollmentId: string;
  studentName: string;
  studentEmail: string;
  paymentStatus: "free" | "pending" | "paid" | "failed" | "refunded";
  priceCents?: number;
  status: string;
}

export interface CourseEmailData {
  title: string;
  slug?: string;
  instructor?: string;
  schedule?: string;
  deliveryFormat?: string;
  shortDescription?: string;
}

function paymentLabel(data: CourseEnrollmentEmailData): string {
  if (data.paymentStatus === "free") return "Free course";
  if (data.paymentStatus === "paid") {
    return data.priceCents != null ? `Paid (${formatCents(data.priceCents)})` : "Paid";
  }
  return data.paymentStatus;
}

export async function sendCourseEnrollmentEmails({
  enrollment,
  course,
}: {
  enrollment: CourseEnrollmentEmailData;
  course: CourseEmailData;
}): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.exploremoreacademy.com";
  const courseUrl = course.slug ? `${appUrl}/courses/${course.slug}` : `${appUrl}/courses`;

  await sendTransactionalEmail({
    to: enrollment.studentEmail,
    subject: `Enrollment Confirmed — ${course.title}`,
    template: "enrollmentConfirmation",
    htmlBody: wrapEmailTemplate(`
      <h2 style="color:#101315">You're enrolled!</h2>
      <p>Hi ${enrollment.studentName}, your enrollment in <strong>${course.title}</strong> is confirmed.</p>
      ${course.shortDescription ? `<p style="color:#555">${course.shortDescription}</p>` : ""}
      <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:20px 0">
        <p style="margin:0 0 8px"><strong>Enrollment ID:</strong> ${enrollment.enrollmentId}</p>
        ${course.instructor ? `<p style="margin:0 0 8px"><strong>Instructor:</strong> ${course.instructor}</p>` : ""}
        ${course.schedule ? `<p style="margin:0 0 8px"><strong>Schedule:</strong> ${course.schedule}</p>` : ""}
        ${course.deliveryFormat ? `<p style="margin:0 0 8px"><strong>Format:</strong> ${course.deliveryFormat}</p>` : ""}
        <p style="margin:0"><strong>Payment:</strong> ${paymentLabel(enrollment)}</p>
      </div>
      <p><a href="${courseUrl}" style="display:inline-block;background:#ff5a16;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">View Course</a></p>
      <p style="margin-top:20px;font-size:14px;color:#666">Questions? Contact us at ${getPublicContactEmail()}.</p>
    `),
    textBody: `You are enrolled in ${course.title}. Enrollment ID: ${enrollment.enrollmentId}.`,
  });

  await sendTransactionalEmail({
    to: getAdminEmail(),
    subject: `New Course Enrollment — ${course.title}`,
    template: "adminCourseEnrollment",
    htmlBody: wrapEmailTemplate(`
      <h2 style="color:#101315">New course enrollment</h2>
      <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0">
        <p style="margin:0 0 6px"><strong>Course:</strong> ${course.title}</p>
        <p style="margin:0 0 6px"><strong>Student:</strong> ${enrollment.studentName}</p>
        <p style="margin:0 0 6px"><strong>Email:</strong> <a href="mailto:${enrollment.studentEmail}">${enrollment.studentEmail}</a></p>
        <p style="margin:0 0 6px"><strong>Enrollment ID:</strong> ${enrollment.enrollmentId}</p>
        <p style="margin:0 0 6px"><strong>Status:</strong> ${enrollment.status}</p>
        <p style="margin:0"><strong>Payment:</strong> ${paymentLabel(enrollment)}</p>
      </div>
      ${course.instructor ? `<p style="font-size:14px;color:#444"><strong>Instructor:</strong> ${course.instructor}</p>` : ""}
      ${course.schedule ? `<p style="font-size:14px;color:#444"><strong>Schedule:</strong> ${course.schedule}</p>` : ""}
      <p style="margin-top:20px">
        <a href="${appUrl}/admin/enrollments" style="display:inline-block;background:#0c8991;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">View Enrollments in Admin</a>
      </p>
    `),
    textBody: `New enrollment: ${enrollment.studentName} (${enrollment.studentEmail}) in ${course.title}.`,
  });
}
