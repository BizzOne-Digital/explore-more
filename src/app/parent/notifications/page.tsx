import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ParentNotification, ParentNotificationRead } from "@/models";
import { NotificationsClient } from "@/components/parent/NotificationsClient";

export default async function ParentNotificationsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/parent/notifications");

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

  const items = notifications.map((n) => ({
    ...n,
    _id: n._id.toString(),
    read: readMap.get(n._id.toString())?.readAt != null,
    acknowledged: readMap.get(n._id.toString())?.acknowledgedAt != null,
  }));

  const unreadCount = items.filter((i) => !i.read).length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Notifications</h2>
        <p className="mt-1 text-sm text-explore-charcoal/70">
          Academy announcements, portfolio review updates, events, and important reminders.
        </p>
      </div>
      <NotificationsClient items={JSON.parse(JSON.stringify(items))} unreadCount={unreadCount} />
    </div>
  );
}
