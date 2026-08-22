import { sendTransactionalEmail, wrapEmailTemplate } from "@/lib/services/email";
import { getAdminEmail } from "@/lib/email/get-admin-email";
import { getAppUrl } from "@/lib/services/stripe";

export async function sendMembershipPurchaseEmails(params: {
  customerName: string;
  customerEmail: string;
  planName: string;
  priceLabel: string;
  interval: "month" | "year";
}) {
  const appUrl = getAppUrl();
  const intervalLabel = params.interval === "year" ? "year" : "month";

  await sendTransactionalEmail({
    to: params.customerEmail,
    subject: `Welcome to ${params.planName} — Explore More Academy`,
    template: "membershipConfirmation",
    htmlBody: wrapEmailTemplate(`
      <h2 style="color:#101315">Thank you for joining, ${params.customerName}!</h2>
      <p>Your <strong>${params.planName}</strong> membership is now active.</p>
      <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0">
        <p style="margin:0 0 6px"><strong>Plan:</strong> ${params.planName}</p>
        <p style="margin:0 0 6px"><strong>Amount:</strong> ${params.priceLabel} / ${intervalLabel}</p>
      </div>
      <p>Create or sign in to your parent account to access your member benefits:</p>
      <a href="${appUrl}/parent/signup" style="display:inline-block;background:#ff5a16;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-right:8px">Create Parent Account</a>
      <a href="${appUrl}/parent/login" style="display:inline-block;background:#0c8991;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Parent Sign In</a>
      <p style="margin-top:24px;font-size:13px;color:#666">Student portal access is included with your membership once your child account is linked.</p>
    `),
    textBody: `Thank you, ${params.customerName}! Your ${params.planName} membership (${params.priceLabel}/${intervalLabel}) is active. Create your parent account at ${appUrl}/parent/signup`,
  });

  await sendTransactionalEmail({
    to: getAdminEmail(),
    subject: `New Membership Purchase — ${params.planName}`,
    template: "adminMembershipPurchase",
    htmlBody: wrapEmailTemplate(`
      <h2 style="color:#101315">New membership purchase</h2>
      <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0">
        <p style="margin:0 0 6px"><strong>Member:</strong> ${params.customerName}</p>
        <p style="margin:0 0 6px"><strong>Email:</strong> ${params.customerEmail}</p>
        <p style="margin:0 0 6px"><strong>Plan:</strong> ${params.planName}</p>
        <p style="margin:0"><strong>Amount:</strong> ${params.priceLabel} / ${intervalLabel}</p>
      </div>
      <a href="${appUrl}/admin" style="display:inline-block;background:#0c8991;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Open Admin</a>
    `),
    textBody: `New membership: ${params.customerName} (${params.customerEmail}) purchased ${params.planName} at ${params.priceLabel}/${intervalLabel}.`,
  });
}
