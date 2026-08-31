import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { ParentNotification, ParentNotificationRead } from "@/models";

export async function GET() {
  try {
    const sessionResult = await requireRole(["parent"]);
    if ("error" in sessionResult) return sessionResult.error;

    await connectDB();

    const notifications = await ParentNotification.find({
      $or: [{ recipientIds: sessionResult.user.id }, { audience: "all_parents" }],
      sentAt: { $ne: null },
    })
      .populate("sentBy", "name")
      .sort({ sentAt: -1 })
      .limit(200);

    const reads = await ParentNotificationRead.find({
      userId: sessionResult.user.id,
      notificationId: { $in: notifications.map((n) => n._id) },
    });
    const readMap = new Map(reads.map((r) => [r.notificationId.toString(), r]));

    const items = notifications
      .filter((n) => !readMap.get(n._id.toString())?.deletedAt)
      .map((n) => {
        const readRecord = readMap.get(n._id.toString());
        return {
          _id: n._id.toString(),
          title: n.title,
          message: n.message,
          priority: n.priority,
          sentAt: n.sentAt,
          requiresAcknowledgment: Boolean(n.requiresAcknowledgment),
          attachmentPath: n.attachmentPath || undefined,
          attachmentName: n.attachmentName || undefined,
          sentBy: n.sentBy,
          read: readRecord?.readAt != null,
          readAt: readRecord?.readAt,
          acknowledged: readRecord?.acknowledgedAt != null,
        };
      });

    const unreadCount = items.filter((i) => !i.read).length;

    return apiSuccess({ items, unreadCount });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const sessionResult = await requireRole(["parent"]);
    if ("error" in sessionResult) return sessionResult.error;

    const { notificationId, acknowledge } = await request.json();
    if (!notificationId) return apiError(new Error("notificationId is required"), 400);

    await connectDB();

    const update: { readAt: Date; acknowledgedAt?: Date } = { readAt: new Date() };
    if (acknowledge) update.acknowledgedAt = new Date();

    const record = await ParentNotificationRead.findOneAndUpdate(
      { notificationId, userId: sessionResult.user.id },
      update,
      { upsert: true, new: true }
    );

    return apiSuccess(record);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const sessionResult = await requireRole(["parent"]);
    if ("error" in sessionResult) return sessionResult.error;

    const body = await request.json();
    const rawIds: unknown = body.notificationIds ?? body.notificationId;
    const notificationIds = (Array.isArray(rawIds) ? rawIds : [rawIds]).filter(
      (id): id is string => typeof id === "string" && id.length > 0
    );

    if (notificationIds.length === 0) {
      return apiError(new Error("notificationId or notificationIds is required"), 400);
    }

    await connectDB();

    const notifications = await ParentNotification.find({
      _id: { $in: notificationIds },
      $or: [{ recipientIds: sessionResult.user.id }, { audience: "all_parents" }],
      sentAt: { $ne: null },
    }).select("_id");

    const allowedIds = notifications.map((n) => n._id.toString());
    if (allowedIds.length === 0) {
      return apiError(new Error("No matching notifications found"), 404);
    }

    const now = new Date();
    await Promise.all(
      allowedIds.map((notificationId) =>
        ParentNotificationRead.findOneAndUpdate(
          { notificationId, userId: sessionResult.user.id },
          { deletedAt: now },
          { upsert: true, new: true }
        )
      )
    );

    return apiSuccess({ deletedCount: allowedIds.length });
  } catch (error) {
    return apiError(error);
  }
}
