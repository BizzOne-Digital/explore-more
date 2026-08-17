import connectDB from "@/lib/db";
import { EmailCampaign, User, ParentNotification } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { auth } from "@/lib/auth";
import { sendTransactionalEmail } from "@/lib/services/email";

export async function GET() {
  try {
    await connectDB();
    const items = await EmailCampaign.find().sort({ createdAt: -1 }).lean();
    return apiSuccess(items);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(new Error("Unauthorized"), 401);
    }
    await connectDB();
    const body = await request.json();
    
    const item = await EmailCampaign.create({
      ...body,
      createdBy: session.user.id,
      recipientCount: body.recipientCount ?? 0,
      sentCount: body.sentCount ?? 0,
      failedCount: body.failedCount ?? 0,
      openedCount: body.openedCount ?? 0,
      clickedCount: body.clickedCount ?? 0,
    });

    // If status is queued, send the campaign
    if (body.status === "queued") {
      // Process in background (don't wait)
      processCampaign(item._id.toString(), session.user.id).catch((err) => {
        console.error("Campaign processing error:", err);
      });
    }

    return apiSuccess(item, 201);
  } catch (error) {
    return apiError(error);
  }
}

async function processCampaign(campaignId: string, userId: string) {
  await connectDB();
  
  const campaign = await EmailCampaign.findById(campaignId);
  if (!campaign) return;

  try {
    // Update status to sending
    campaign.status = "sending";
    await campaign.save();

    // Get recipients
    let recipients: string[] = [];
    
    if (campaign.audience === "custom" && campaign.recipientIds?.length) {
      recipients = campaign.recipientIds.map((id) => id.toString());
    } else {
      // Get recipients based on audience
      switch (campaign.audience) {
        case "all_parents":
          const allParents = await User.find({ role: "parent", isActive: true }).select("_id");
          recipients = allParents.map((p) => p._id.toString());
          break;

        case "portfolio_parents":
          try {
            const { HomeschoolPortfolio } = await import("@/models/Portfolio");
            const portfolios = await HomeschoolPortfolio.find().distinct("guardianId");
            recipients = portfolios.map((id: unknown) => String(id));
          } catch {
            recipients = [];
          }
          break;

        case "tutoring_parents":
          const tutorParents = await User.find({ role: "parent", isActive: true }).select("_id");
          recipients = tutorParents.map((p) => p._id.toString());
          break;
      }
    }

    const priorityColors = {
      normal: "#0c8991",
      important: "#f59e0b",
      urgent: "#ef4444",
    };

    const priorityLabels = {
      normal: "📢",
      important: "⚠️",
      urgent: "🚨",
    };

    let sentCount = 0;
    let failedCount = 0;

    // Send via notification if needed
    if (campaign.deliveryMethod === "notification" || campaign.deliveryMethod === "both") {
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
    }

    // Send via email if needed
    if (campaign.deliveryMethod === "email" || campaign.deliveryMethod === "both") {
      const parentUsers = await User.find({
        _id: { $in: recipients },
        isActive: true,
      }).select("email name");

      await Promise.all(
        parentUsers.map(async (parent) => {
          try {
            await sendTransactionalEmail({
              to: parent.email,
              subject: `${priorityLabels[campaign.priority]} ${campaign.subject}`,
              htmlBody: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background: ${priorityColors[campaign.priority]}; padding: 20px; border-radius: 8px 8px 0 0;">
                    <h2 style="color: white; margin: 0;">
                      ${priorityLabels[campaign.priority]} ${campaign.subject}
                    </h2>
                  </div>
                  
                  <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
                    <p>Hello ${parent.name},</p>
                    
                    <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                      ${campaign.htmlBody}
                    </div>

                    ${
                      campaign.attachmentUrl
                        ? `<div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${priorityColors[campaign.priority]};">
                          <p style="margin: 0; font-size: 14px;">
                            📎 <strong>Attachment:</strong> <a href="${campaign.attachmentUrl}" style="color: ${priorityColors[campaign.priority]};">${campaign.attachmentName || "Download File"}</a>
                          </p>
                        </div>`
                        : ""
                    }

                    <div style="margin: 30px 0;">
                      <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3004"}/parent/notifications" 
                         style="background: ${priorityColors[campaign.priority]}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                        View in Parent Portal
                      </a>
                    </div>

                    <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px;">
                      This is a ${campaign.priority} message from Explore More Academy.<br>
                      You can manage your notification preferences in your parent portal.
                    </p>
                  </div>
                </div>
              `,
              template: "campaign",
            });
            sentCount++;
          } catch (err) {
            console.error(`Failed to send email to ${parent.email}:`, err);
            failedCount++;
          }
        })
      );
    } else {
      // If notification only, count all as sent
      sentCount = recipients.length;
    }

    // Update campaign status
    campaign.status = "sent";
    campaign.sentAt = new Date();
    campaign.sentCount = sentCount;
    campaign.failedCount = failedCount;
    await campaign.save();
  } catch (error) {
    console.error("Campaign processing failed:", error);
    campaign.status = "failed";
    await campaign.save();
  }
}

