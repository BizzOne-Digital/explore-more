import { sendTransactionalEmail, wrapEmailTemplate } from "@/lib/services/email";
import { getPublicContactEmail } from "@/lib/email/get-admin-email";
import { getAppUrl } from "@/lib/services/stripe";
import { formatCents } from "@/lib/utils";

export type PaymentCheckoutType = "books" | "course" | "event" | "membership" | "donation";

const CHECKOUT_LABELS: Record<PaymentCheckoutType, string> = {
  books: "book order",
  course: "course enrollment",
  event: "event registration",
  membership: "membership",
  donation: "donation",
};

const RETRY_PATHS: Record<PaymentCheckoutType, string> = {
  books: "/books",
  course: "/courses",
  event: "/events",
  membership: "/membership",
  donation: "/sponsor-a-kid",
};

export async function sendPaymentFailureEmail(params: {
  customerName: string;
  customerEmail: string;
  checkoutType: PaymentCheckoutType;
  reason: string;
  itemLabel?: string;
  amountCents?: number;
  reference?: string;
}) {
  const appUrl = getAppUrl();
  const checkoutLabel = CHECKOUT_LABELS[params.checkoutType];
  const retryUrl = `${appUrl}${RETRY_PATHS[params.checkoutType]}`;
  const contactEmail = getPublicContactEmail();
  const amountLine =
    params.amountCents != null
      ? `<p style="margin:0 0 6px"><strong>Amount:</strong> ${formatCents(params.amountCents)}</p>`
      : "";
  const itemLine = params.itemLabel
    ? `<p style="margin:0 0 6px"><strong>Item:</strong> ${params.itemLabel}</p>`
    : "";
  const referenceLine = params.reference
    ? `<p style="margin:0"><strong>Reference:</strong> ${params.reference}</p>`
    : "";

  await sendTransactionalEmail({
    to: params.customerEmail,
    subject: `Payment Not Completed — Explore More Academy`,
    template: "paymentFailure",
    htmlBody: wrapEmailTemplate(`
      <h2 style="color:#101315">Your payment was not completed</h2>
      <p>Hi ${params.customerName},</p>
      <p>We were unable to complete your ${checkoutLabel}${params.itemLabel ? ` for <strong>${params.itemLabel}</strong>` : ""}.</p>
      <div style="background:#fff4f0;border:1px solid #ffd4c4;padding:16px;border-radius:8px;margin:20px 0">
        <p style="margin:0 0 8px;font-weight:600;color:#b42318">Reason</p>
        <p style="margin:0;color:#444">${params.reason}</p>
      </div>
      <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:20px 0">
        ${itemLine}
        ${amountLine}
        ${referenceLine}
      </div>
      <p>No charge was completed for this attempt. You can try again using the link below:</p>
      <a href="${retryUrl}" style="display:inline-block;background:#0c8991;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;margin-top:8px">Try Again</a>
      <p style="margin-top:24px;font-size:14px;color:#666">
        If you believe this is a mistake or need help, reply to this email or contact us at
        <a href="mailto:${contactEmail}" style="color:#0c8991">${contactEmail}</a>.
      </p>
    `),
    textBody: `Hi ${params.customerName}, your ${checkoutLabel} payment was not completed. Reason: ${params.reason}. Try again: ${retryUrl}. Contact: ${contactEmail}`,
  });
}
