import connectDB from "@/lib/db";
import { EmailCampaign, User, ParentNotification } from "@/models";
import {
  resolveNotificationRecipients,
  type BroadcastAudience,
} from "@/lib/notifications/recipients";
const priorityColors = {
  normal: "#0c8991",
  important: "#f59e0b",
  urgent: "#ef4444",
} as const;

const priorityLabels = {
  normal: "📢",
  important: "⚠️",
  urgent: "🚨",
} as const;

export async function processEmailCampaign(campaignId: string): Promise<void> {
  await connectDB();

  const campaign = await EmailCampaign.findById(campaignId);
  if (!campaign) return;

  if (campaign.status === "sent" || campaign.status === "sending") {
    return;
  }

  try {
    campaign.status = "sending";
    await campaign.save();

    let recipients: string[] = [];

    if (campaign.audience === "custom" && campaign.recipientIds?.length) {
      recipients = campaign.recipientIds.map((id) => id.toString());
    } else if (campaign.audience !== "custom") {
      recipients = await resolveNotificationRecipients(campaign.audience as BroadcastAudience);
    }

    const hasNotificationDelivery =
      campaign.deliveryMethod === "notification" || campaign.deliveryMethod === "both";
    const hasEmailDelivery = campaign.deliveryMethod === "email" || campaign.deliveryMethod === "both";

    if (
      recipients.length === 0 &&
      !(campaign.audience === "all_parents" && hasNotificationDelivery)
    ) {
      campaign.status = "failed";
      campaign.failedCount = 0;
      campaign.sentCount = 0;
      await campaign.save();
      return;
    }

    let sentCount = 0;
    let failedCount = 0;

    if (hasNotificationDelivery) {
      await ParentNotification.create({
        title: campaign.subject,
        message: campaign.htmlBody,
        audience: campaign.audience,
        recipientIds: recipients,
        priority: campaign.priority,
        attachmentPath: campaign.attachmentUrl,
        attachmentName: campaign.attachmentName,
        sentBy: campaign.createdBy,
        sentAt: new Date(),
      });

      if (!hasEmailDelivery) {
        sentCount = recipients.length > 0 ? recipients.length : 1;
      }
    }

    if (hasEmailDelivery) {
      const { sendTransactionalEmail } = await import("@/lib/services/email");

      const parentUsers =
        recipients.length > 0
          ? await User.find({
              _id: { $in: recipients },
              isActive: { $ne: false },
            }).select("email name")
          : [];

      await Promise.all(
        parentUsers.map(async (parent) => {
          try {
            await sendTransactionalEmail({
              to: parent.email,
              subject: `${priorityLabels[campaign.priority]} ${campaign.subject}`,
              htmlBody: buildCampaignEmailHtml(campaign.subject, campaign.htmlBody, campaign),
              template: "campaign",
            });
            sentCount++;
          } catch (err) {
            console.error(`Failed to send email to ${parent.email}:`, err);
            failedCount++;
          }
        })
      );
    }

    campaign.status = "sent";
    campaign.sentAt = new Date();
    campaign.recipientCount = recipients.length;
    campaign.sentCount = sentCount;
    campaign.failedCount = failedCount;
    await campaign.save();
  } catch (error) {
    console.error("Campaign processing failed:", error);
    campaign.status = "failed";
    await campaign.save();
  }
}

function buildCampaignEmailHtml(
  subject: string,
  htmlBody: string,
  campaign: {
    priority: keyof typeof priorityColors;
    attachmentUrl?: string;
    attachmentName?: string;
    imageUrl?: string;
    imageName?: string;
  }
): string {
  const color = priorityColors[campaign.priority];
  const label = priorityLabels[campaign.priority];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3004";
  const imageSrc = campaign.imageUrl?.startsWith("http")
    ? campaign.imageUrl
    : campaign.imageUrl
      ? `${appUrl}${campaign.imageUrl}`
      : "";

  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: ${color}; padding: 20px; border-radius: 8px 8px 0 0;">
        <h2 style="color: white; margin: 0;">
          ${label} ${subject}
        </h2>
      </div>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
        ${
          imageSrc
            ? `<div style="margin: 20px 0;">
              <img src="${imageSrc}" alt="${campaign.imageName || "Campaign image"}" style="max-width: 100%; height: auto; border-radius: 8px; display: block;" />
            </div>`
            : ""
        }
        <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
          ${htmlBody}
        </div>

        ${
          campaign.attachmentUrl
            ? `<div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${color};">
              <p style="margin: 0; font-size: 14px;">
                📎 <strong>Attachment:</strong> <a href="${campaign.attachmentUrl.startsWith("http") ? campaign.attachmentUrl : `${appUrl}${campaign.attachmentUrl.startsWith("/") ? "" : "/"}${campaign.attachmentUrl}`}" style="color: ${color};">${campaign.attachmentName || "Download File"}</a>
              </p>
            </div>`
            : ""
        }

        <div style="margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3004"}/parent/notifications" 
             style="background: ${color}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            View in Parent Portal
          </a>
        </div>

        <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px;">
          This is a ${campaign.priority} message from Explore More Academy.<br>
          You can manage your notification preferences in your parent portal.
        </p>
      </div>
    </div>
  `;
}
