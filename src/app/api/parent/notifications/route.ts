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
      .limit(50);

    const reads = await ParentNotificationRead.find({
      userId: sessionResult.user.id,
      notificationId: { $in: notifications.map((n) => n._id) },
    });
    const readMap = new Map(reads.map((r) => [r.notificationId.toString(), r]));

    const items = notifications.map((n) => ({
      ...n.toObject(),
      read: readMap.get(n._id.toString())?.readAt != null,
      acknowledged: readMap.get(n._id.toString())?.acknowledgedAt != null,
    }));

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
