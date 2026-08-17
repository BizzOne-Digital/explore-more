import connectDB from "@/lib/db";
import { EmailCampaign, User, ParentNotification } from "@/models";
import { apiSuccess, apiError, notFound } from "@/lib/admin/api";
import { auth } from "@/lib/auth";
import { sendTransactionalEmail } from "@/lib/services/email";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    await connectDB();
    const item = await EmailCampaign.findById(id).lean();
    if (!item) return notFound();
    return apiSuccess(item);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(new Error("Unauthorized"), 401);
    }

    const { id } = await params;
    await connectDB();
    const body = await request.json();

    const item = await EmailCampaign.findById(id);
    if (!item) return notFound();

    if (item.status === "sent") {
      return apiError(new Error("Cannot edit a sent campaign"), 400);
    }

    Object.assign(item, body);
    await item.save();

    if (body.status === "queued") {
      processCampaign(item._id.toString(), session.user.id).catch((err) => {
        console.error("Campaign processing error:", err);
      });
    }

    return apiSuccess(item);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(new Error("Unauthorized"), 401);
    }

    const { id } = await params;
    await connectDB();
    const item = await EmailCampaign.findById(id);
    if (!item) return notFound();

    if (item.status === "sent") {
      return apiError(new Error("Cannot delete a sent campaign"), 400);
    }

    await item.deleteOne();
    return apiSuccess({ message: "Campaign deleted" });
  } catch (error) {
    return apiError(error);
  }
}

async function processCampaign(campaignId: string, userId: string) {
  await connectDB();

  const campaign = await EmailCampaign.findById(campaignId);
  if (!campaign) return;

  try {
    campaign.status = "sending";
    await campaign.save();

    let recipients: string[] = [];

    if (campaign.audience === "custom" && campaign.recipientIds?.length) {
      recipients = campaign.recipientIds.map((id) => id.toString());
    } else {
      switch (campaign.audience) {
        case "all_parents": {
          const allParents = await User.find({ role: "parent", isActive: true }).select("_id");
          recipients = allParents.map((p) => p._id.toString());
          break;
        }

        case "portfolio_parents": {
          try {
            const { HomeschoolPortfolio } = await import("@/models/Portfolio");
            const portfolios = await HomeschoolPortfolio.find().distinct("guardianId");
            recipients = portfolios.map((id) => id.toString());
          } catch {
            recipients = [];
          }
          break;
        }

        case "tutoring_parents": {
          const tutorParents = await User.find({ role: "parent", isActive: true }).select("_id");
          recipients = tutorParents.map((p) => p._id.toString());
          break;
        }
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
      sentCount = recipients.length;
    }

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
