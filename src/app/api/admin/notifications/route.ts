import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { ParentNotification, ParentNotificationRead, User } from "@/models";

export async function GET() {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    await connectDB();
    const notifications = await ParentNotification.find()
      .populate("sentBy", "name")
      .sort({ createdAt: -1 })
      .limit(50);

    const stats = await Promise.all(
      notifications.map(async (n) => {
        const reads = await ParentNotificationRead.find({ notificationId: n._id });
        const recipientCount = n.recipientIds.length || (await User.countDocuments({ role: "parent" }));
        return {
          id: n._id.toString(),
          title: n.title,
          sentAt: n.sentAt,
          recipientCount,
          read: reads.filter((r) => r.readAt).length,
          acknowledged: reads.filter((r) => r.acknowledgedAt).length,
        };
      })
    );

    return apiSuccess({ notifications, stats });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    const body = await request.json();
    const { title, message, audience, priority, requiresAcknowledgment, recipientIds, sendNow } = body;

    if (!title?.trim() || !message?.trim()) {
      return apiError(new Error("title and message are required"), 400);
    }

    await connectDB();

    let recipients = recipientIds ?? [];
    if (audience === "all_parents" || !audience) {
      const parents = await User.find({ role: "parent", isActive: true }).select("_id");
      recipients = parents.map((p) => p._id);
    }

    const notification = await ParentNotification.create({
      title: title.trim(),
      message: message.trim(),
      audience: audience ?? "all_parents",
      recipientIds: recipients,
      priority: priority ?? "normal",
      requiresAcknowledgment: requiresAcknowledgment ?? false,
      sentBy: sessionResult.user.id,
      sentAt: sendNow !== false ? new Date() : undefined,
    });

    return apiSuccess(notification, 201);
  } catch (error) {
    return apiError(error);
  }
}
