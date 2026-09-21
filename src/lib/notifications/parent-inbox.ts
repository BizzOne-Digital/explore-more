import connectDB from "@/lib/db";
import { ParentNotification, ParentNotificationRead } from "@/models";

/**
 * Notifications visible in the parent portal inbox for this user.
 * Uses explicit recipientIds only (set when sending, including “all parents” broadcasts).
 */
export function parentNotificationInboxFilter(userId: string) {
  return {
    sentAt: { $ne: null },
    recipientIds: userId,
  };
}

/** Marks every inbox notification as read for the user (idempotent). */
export async function markAllParentNotificationsRead(userId: string): Promise<number> {
  await connectDB();

  const notifications = await ParentNotification.find(parentNotificationInboxFilter(userId))
    .select("_id")
    .lean();

  if (notifications.length === 0) return 0;

  const now = new Date();
  await Promise.all(
    notifications.map((notification) =>
      ParentNotificationRead.findOneAndUpdate(
        { notificationId: notification._id, userId },
        { $set: { readAt: now } },
        { upsert: true }
      )
    )
  );

  return notifications.length;
}
