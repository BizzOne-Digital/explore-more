import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ParentNotification, ParentNotificationRead } from "@/models";
import { NotificationsClient } from "@/components/parent/NotificationsClient";

export default async function ParentNotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/parent/login?callbackUrl=/parent/notifications");

  await connectDB();

  const notifications = await ParentNotification.find({
    $or: [{ recipientIds: session.user.id }, { audience: "all_parents" }],
    sentAt: { $ne: null },
  })
    .populate("sentBy", "name")
    .sort({ sentAt: -1 })
    .limit(50)
    .lean();

  const reads = await ParentNotificationRead.find({
    userId: session.user.id,
    notificationId: { $in: notifications.map((n) => n._id) },
  });

  const readMap = new Map(reads.map((r) => [r.notificationId.toString(), r]));

  const visibleNotifications = notifications.filter(
    (n) => !readMap.get(n._id.toString())?.deletedAt
  );

  const items = visibleNotifications.map((n) => {
    const readRecord = readMap.get(n._id.toString());
    return {
      _id: n._id.toString(),
      title: n.title,
      message: n.message,
      priority: n.priority,
      sentAt: n.sentAt ? new Date(n.sentAt).toISOString() : undefined,
      requiresAcknowledgment: Boolean(n.requiresAcknowledgment),
      attachmentPath: n.attachmentPath || undefined,
      attachmentName: n.attachmentName || undefined,
      sentBy:
        n.sentBy && typeof n.sentBy === "object" && "name" in n.sentBy
          ? { name: (n.sentBy as { name?: string }).name }
          : undefined,
      read: readRecord?.readAt != null,
      readAt: readRecord?.readAt ? new Date(readRecord.readAt).toISOString() : undefined,
      acknowledged: readRecord?.acknowledgedAt != null,
    };
  });

  const unreadCount = items.filter((i) => !i.read).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Notifications</h2>
        <p className="mt-1 text-sm text-explore-charcoal/70">
          Academy announcements, portfolio review updates, events, and important reminders.
        </p>
      </div>
      <NotificationsClient items={items} unreadCount={unreadCount} />
    </div>
  );
}
