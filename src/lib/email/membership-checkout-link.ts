import { sendTransactionalEmail, wrapEmailTemplate } from "@/lib/services/email";
import { getPublicContactEmail } from "@/lib/email/get-admin-email";

export async function sendMembershipCheckoutLinkEmail(params: {
  customerName: string;
  customerEmail: string;
  planName: string;
  checkoutUrl: string;
}) {
  const contactEmail = getPublicContactEmail();

  await sendTransactionalEmail({
    to: params.customerEmail,
    subject: `Complete your ${params.planName} membership — Explore More Academy`,
    template: "membershipCheckoutLink",
    htmlBody: wrapEmailTemplate(`
      <h2 style="color:#101315">Complete your membership billing</h2>
      <p>Hi ${params.customerName},</p>
      <p>Please use the secure link below to add your payment method and connect your <strong>${params.planName}</strong> membership to automatic billing.</p>
      <a href="${params.checkoutUrl}" style="display:inline-block;background:#0c8991;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin:16px 0">Complete membership checkout</a>
      <p style="font-size:14px;color:#666">After payment, you can manage your card anytime from the parent portal under <strong>Billing &amp; Subscription</strong>.</p>
      <p style="font-size:14px;color:#666">Questions? Contact us at <a href="mailto:${contactEmail}" style="color:#0c8991">${contactEmail}</a>.</p>
    `),
    textBody: `Hi ${params.customerName}, complete your ${params.planName} membership billing: ${params.checkoutUrl}. Questions: ${contactEmail}`,
  });
}
