import { sendTransactionalEmail, wrapEmailTemplate } from "@/lib/services/email";
import { formatCents } from "@/lib/utils";
import { getAdminEmail, getPublicContactEmail } from "@/lib/email/get-admin-email";

export interface DonationEmailData {
  donationId: string;
  donorName: string;
  donorEmail: string;
  amountCents: number;
  isAnonymous?: boolean;
  message?: string;
}

export interface CampaignEmailData {
  title: string;
  slug?: string;
  goalCents?: number;
  raisedCents?: number;
}

function donorDisplayName(donation: DonationEmailData): string {
  return donation.isAnonymous ? "Anonymous Donor" : donation.donorName;
}

export async function sendDonationEmails({
  donation,
  campaign,
}: {
  donation: DonationEmailData;
  campaign: CampaignEmailData;
}): Promise<void> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.exploremoreacademy.com";
  const campaignUrl = campaign.slug ? `${appUrl}/donate/${campaign.slug}` : `${appUrl}/sponsor-a-kid`;
  const amount = formatCents(donation.amountCents);

  await sendTransactionalEmail({
    to: donation.donorEmail,
    subject: `Thank You for Your Donation — ${campaign.title}`,
    template: "donationConfirmation",
    htmlBody: wrapEmailTemplate(`
      <h2 style="color:#101315">Thank you, ${donation.donorName}!</h2>
      <p>Your generous donation of <strong>${amount}</strong> to <strong>${campaign.title}</strong> has been received.</p>
      <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:20px 0">
        <p style="margin:0 0 8px"><strong>Donation ID:</strong> ${donation.donationId}</p>
        <p style="margin:0 0 8px"><strong>Campaign:</strong> ${campaign.title}</p>
        <p style="margin:0"><strong>Amount:</strong> ${amount}</p>
      </div>
      ${donation.message ? `<p style="font-size:14px;color:#555"><strong>Your message:</strong> ${donation.message}</p>` : ""}
      <p>Your support helps us provide outdoor education and opportunities for youth in our community.</p>
      <p style="margin-top:20px"><a href="${campaignUrl}" style="display:inline-block;background:#ff5a16;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">View Campaign</a></p>
      <p style="margin-top:20px;font-size:14px;color:#666">Questions? Contact us at ${getPublicContactEmail()}.</p>
    `),
    textBody: `Thank you for your donation of ${amount} to ${campaign.title}. Donation ID: ${donation.donationId}.`,
  });

  await sendTransactionalEmail({
    to: getAdminEmail(),
    subject: `New Donation — ${campaign.title}`,
    template: "adminDonationNotification",
    htmlBody: wrapEmailTemplate(`
      <h2 style="color:#101315">New campaign donation</h2>
      <div style="background:#f5f5f5;padding:16px;border-radius:8px;margin:16px 0">
        <p style="margin:0 0 6px"><strong>Campaign:</strong> ${campaign.title}</p>
        <p style="margin:0 0 6px"><strong>Donation ID:</strong> ${donation.donationId}</p>
        <p style="margin:0 0 6px"><strong>Amount:</strong> ${amount}</p>
        ${campaign.goalCents != null ? `<p style="margin:0"><strong>Campaign goal:</strong> ${formatCents(campaign.goalCents)}</p>` : ""}
      </div>
      <h3 style="font-size:16px;color:#101315">Donor</h3>
      <p style="font-size:14px;color:#444;margin:0 0 4px"><strong>Name:</strong> ${donorDisplayName(donation)}</p>
      ${donation.isAnonymous ? `<p style="font-size:14px;color:#444;margin:0 0 4px"><em>Donor chose to remain anonymous publicly.</em></p>` : ""}
      <p style="font-size:14px;color:#444;margin:0 0 4px"><strong>Email:</strong> <a href="mailto:${donation.donorEmail}">${donation.donorEmail}</a></p>
      ${donation.message ? `<p style="font-size:14px;color:#444;margin:0"><strong>Message:</strong> ${donation.message}</p>` : ""}
      <p style="margin-top:20px">
        <a href="${appUrl}/admin/donations" style="display:inline-block;background:#0c8991;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:600">View Donations in Admin</a>
      </p>
    `),
    textBody: `New donation of ${amount} to ${campaign.title} from ${donorDisplayName(donation)} (${donation.donorEmail}).`,
  });
}
