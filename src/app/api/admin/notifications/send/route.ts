import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { ZodError } from "zod";
import { z } from "zod";
import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { ParentNotification, User } from "@/models";
import { sendTransactionalEmail } from "@/lib/services/email";
import {
  allowsEmptyRecipients,
  noRecipientsMessage,
  resolveNotificationRecipients,
} from "@/lib/notifications/recipients";
import {
  containsLocalFilesystemPath,
  parentNotificationFileUrl,
  stripLocalPathsFromMessage,
} from "@/lib/notifications/paths";

export const runtime = "nodejs";

const notificationSchema = z
  .object({
    title: z.string().min(1),
    message: z.string().min(1),
    audience: z.enum(["all_parents", "portfolio_parents", "tutoring_parents", "custom"]),
    priority: z.enum(["normal", "important", "urgent"]),
    attachmentPath: z.string().optional(),
    attachmentName: z.string().optional(),
    recipientIds: z.array(z.string().min(1)).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.audience === "custom" && (!data.recipientIds || data.recipientIds.length === 0)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select at least one parent account for a custom notification.",
        path: ["recipientIds"],
      });
    }
  });

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatApiError(error: unknown, fallback: string): { message: string; status: number } {
  if (error instanceof ZodError) {
    return { message: error.issues[0]?.message ?? "Invalid notification data", status: 400 };
  }

  if (error instanceof mongoose.Error.ValidationError) {
    return { message: error.message, status: 400 };
  }

  if (error instanceof mongoose.Error.CastError) {
    return { message: `Invalid data: ${error.message}`, status: 400 };
  }

  const message = error instanceof Error ? error.message : fallback;
  const status = /file|upload|size|type|invalid|validation|required|cast/i.test(message) ? 400 : 500;
  return { message, status };
}

function toObjectIds(ids: string[]): mongoose.Types.ObjectId[] {
  return ids.map((id) => new mongoose.Types.ObjectId(id));
}

export async function POST(request: NextRequest) {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

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

    const message =
      data.attachmentPath?.trim() && containsLocalFilesystemPath(data.message)
        ? stripLocalPathsFromMessage(data.message) || data.message.trim()
        : data.message;

    const recipientStrings =
      data.audience === "custom"
        ? (data.recipientIds ?? [])
        : await resolveNotificationRecipients(data.audience);

    if (recipientStrings.length === 0 && !allowsEmptyRecipients(data.audience)) {
      return NextResponse.json({ error: noRecipientsMessage(data.audience) }, { status: 400 });
    }

    const recipientIds = toObjectIds(recipientStrings);
    const sentBy = new mongoose.Types.ObjectId(sessionResult.user.id);

    const notification = await ParentNotification.create({
      title: data.title.trim(),
      message,
      audience: data.audience,
      priority: data.priority,
      recipientIds,
      attachmentPath: data.attachmentPath?.trim() || undefined,
      attachmentName: data.attachmentName?.trim() || undefined,
      sentAt: new Date(),
      sentBy,
    });

    const parentUsers = await User.find({
      _id: { $in: recipientIds },
      isActive: true,
    }).select("email name");

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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3004";
    const safeMessage = escapeHtml(message);
    const attachmentBlock = data.attachmentPath?.trim()
      ? `<div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;">
            📎 <strong>Attachment:</strong>
            <a href="${appUrl}${parentNotificationFileUrl(data.attachmentPath)}" style="color: ${priorityColors[data.priority]};">
              ${escapeHtml(data.attachmentName || "View attachment")}
            </a>
          </p>
        </div>`
      : "";

    void (async () => {
      for (const parent of parentUsers) {
        try {
          await sendTransactionalEmail({
            to: parent.email,
            subject: `${priorityLabels[data.priority]} ${data.title}`,
            htmlBody: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background: ${priorityColors[data.priority]}; padding: 20px; border-radius: 8px 8px 0 0;">
                  <h2 style="color: white; margin: 0;">
                    ${priorityLabels[data.priority]} ${escapeHtml(data.title)}
                  </h2>
                </div>
                <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
                  <p>Hello ${escapeHtml(parent.name)},</p>
                  <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
                    <p style="margin: 0; white-space: pre-wrap;">${safeMessage}</p>
                  </div>
                  ${attachmentBlock}
                  <div style="margin: 30px 0;">
                    <a href="${appUrl}/parent/notifications"
                       style="background: ${priorityColors[data.priority]}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                      View in Parent Portal
                    </a>
                  </div>
                  <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px;">
                    This is a ${data.priority} notification from Explore More Academy.
                  </p>
                </div>
              </div>
            `,
            template: "notification",
          });
        } catch (err) {
          console.error(`Failed to send notification email to ${parent.email}:`, err);
        }
      }
    })();

    const successMessage =
      recipientStrings.length > 0
        ? `Notification sent to ${recipientStrings.length} parent(s)`
        : "Notification published. It will appear in the parent portal when parent accounts sign up.";

    return NextResponse.json({
      success: true,
      message: successMessage,
      notificationId: notification._id,
      recipientCount: recipientStrings.length,
    });
  } catch (error) {
    console.error("Send notification error:", error);
    const { message, status } = formatApiError(error, "Failed to send notification");
    return NextResponse.json({ error: message }, { status });
  }
}
