import { sendTransactionalEmail, wrapEmailTemplate } from "@/lib/services/email";
import { getAdminEmail, getPublicContactEmail } from "@/lib/email/get-admin-email";
import { getAppUrl } from "@/lib/services/stripe";

export async function sendContactFormEmails(data: {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
}) {
  const subjectLine = data.subject?.trim() || "Website contact form";

  await sendTransactionalEmail({
    to: getAdminEmail(),
    subject: `Contact Form — ${subjectLine}`,
    template: "adminContactForm",
    htmlBody: wrapEmailTemplate(`
      <h2 style="color:#101315">New contact form message</h2>
      <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0">
        <p style="margin:0 0 6px"><strong>From:</strong> ${data.name}</p>
        <p style="margin:0 0 6px"><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
        ${data.phone ? `<p style="margin:0 0 6px"><strong>Phone:</strong> ${data.phone}</p>` : ""}
        <p style="margin:0 0 6px"><strong>Subject:</strong> ${subjectLine}</p>
      </div>
      <p style="white-space:pre-wrap;color:#444">${data.message}</p>
      <p style="margin-top:20px"><a href="${getAppUrl()}/admin/messages" style="color:#0c8991">View in admin</a></p>
    `),
    textBody: `Contact from ${data.name} (${data.email})\nSubject: ${subjectLine}\n\n${data.message}`,
  });

  await sendTransactionalEmail({
    to: data.email,
    subject: "We received your message — Explore More Academy",
    template: "contactFormConfirmation",
    htmlBody: wrapEmailTemplate(`
      <h2 style="color:#101315">Thanks for reaching out, ${data.name}!</h2>
      <p>We received your message and will respond within 2 business days.</p>
      <p style="margin-top:20px;font-size:14px;color:#666">Questions? Contact us at ${getPublicContactEmail()}.</p>
    `),
    textBody: `Thanks ${data.name}! We received your message and will respond soon. Contact: ${getPublicContactEmail()}`,
  });
}
