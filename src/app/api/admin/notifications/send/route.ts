import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { ParentNotification, User } from "@/models";
import { sendTransactionalEmail } from "@/lib/services/email";
import {
  allowsEmptyRecipients,
  noRecipientsMessage,
  resolveNotificationRecipients,
} from "@/lib/notifications/recipients";
import { containsLocalFilesystemPath } from "@/lib/notifications/display";
import { z } from "zod";

const notificationSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  audience: z.enum(["all_parents", "portfolio_parents", "tutoring_parents"]),
  priority: z.enum(["normal", "important", "urgent"]),
  attachmentPath: z.string().optional(),
  attachmentName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "administrator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const data = notificationSchema.parse(body);

    if (containsLocalFilesystemPath(data.message) && !data.attachmentPath?.trim()) {
      return NextResponse.json(
        {
          error:
            "The message contains a file path from your computer. Upload the PDF using the Attachment field instead of pasting a local path.",
        },
        { status: 400 }
      );
    }

    await connectDB();

    const recipients = await resolveNotificationRecipients(data.audience);

    if (recipients.length === 0 && !allowsEmptyRecipients(data.audience)) {
      return NextResponse.json({ error: noRecipientsMessage(data.audience) }, { status: 400 });
    }

    // Create notification record
    const notification = await ParentNotification.create({
      title: data.title,
      message: data.message,
      audience: data.audience,
      priority: data.priority,
      recipientIds: recipients,
      attachmentPath: data.attachmentPath,
      attachmentName: data.attachmentName,
      sentAt: new Date(),
      sentBy: session.user.id,
    });

    // Send emails to parents (async, don't wait)
    const parentUsers = await User.find({
      _id: { $in: recipients },
      isActive: true,
    }).select("email name");

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

    // Send emails in batches (don't block response)
    Promise.all(
      parentUsers.map((parent) =>
        sendTransactionalEmail({
          to: parent.email,
          subject: `${priorityLabels[data.priority]} ${data.title}`,
          htmlBody: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: ${priorityColors[data.priority]}; padding: 20px; border-radius: 8px 8px 0 0;">
                <h2 style="color: white; margin: 0;">
                  ${priorityLabels[data.priority]} ${data.title}
                </h2>
              </div>
              
              <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
                <p>Hello ${parent.name},</p>
                
                <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; white-space: pre-wrap;">${data.message}</p>
                </div>

                ${
                  data.attachmentPath
                    ? `<div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 0; font-size: 14px;">
                    📎 <strong>Attachment:</strong>
                    <a href="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3004"}${data.attachmentPath.startsWith("/") ? "" : "/"}${data.attachmentPath}" style="color: ${priorityColors[data.priority]};">
                      ${data.attachmentName || "View attachment"}
                    </a>
                  </p>
                </div>`
                    : ""
                }

                <div style="margin: 30px 0;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004'}/parent/notifications" 
                     style="background: ${priorityColors[data.priority]}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                    View in Parent Portal
                  </a>
                </div>

                <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px;">
                  This is a ${data.priority} notification from Explore More Academy.<br>
                  You can manage your notification preferences in your parent portal.
                </p>
              </div>
            </div>
          `,
          template: "notification",
        }).catch((err) => {
          console.error(`Failed to send email to ${parent.email}:`, err);
        })
      )
    ).catch((err) => {
      console.error("Batch email error:", err);
    });

    const message =
      recipients.length > 0
        ? `Notification sent to ${recipients.length} parent(s)`
        : "Notification published. It will appear in the parent portal when parent accounts sign up.";

    return NextResponse.json({
      success: true,
      message,
      notificationId: notification._id,
      recipientCount: recipients.length,
    });
  } catch (error) {
    console.error("Send notification error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send notification" },
      { status: 500 }
    );
  }
}
