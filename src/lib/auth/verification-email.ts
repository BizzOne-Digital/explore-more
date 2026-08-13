import { getAppUrl } from "@/lib/services/stripe";
import { sendTransactionalEmail, emailTemplates } from "@/lib/services/email";

export async function sendVerificationEmail(params: {
  name: string;
  email: string;
  token: string;
}) {
  const verifyUrl = `${getAppUrl()}/verify-email?email=${encodeURIComponent(params.email)}&token=${params.token}`;
  const tpl = emailTemplates.verification(params.name, verifyUrl, params.token);

  return sendTransactionalEmail({
    to: params.email,
    subject: tpl.subject,
    htmlBody: tpl.html,
    textBody: tpl.textBody,
    template: "verification",
  });
}
