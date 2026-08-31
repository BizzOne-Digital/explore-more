import { PageHeader } from "@/components/admin/PageHeader";
import { SendNotificationForm } from "@/components/admin/SendNotificationForm";
import { AdminNotificationsList } from "@/components/admin/AdminNotificationsList";
import connectDB from "@/lib/db";
import { ParentNotification } from "@/models";
import { serializeAdmin } from "@/lib/admin/serialize";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  await connectDB();

  const recentNotifications = await ParentNotification.find()
    .sort({ sentAt: -1 })
    .limit(50)
    .lean();

  const items = serializeAdmin(
    recentNotifications.map((notif) => ({
      _id: notif._id.toString(),
      title: notif.title,
      message: notif.message,
      priority: notif.priority,
      audience: notif.audience,
      sentAt: notif.sentAt ? new Date(notif.sentAt).toISOString() : undefined,
      attachmentPath: notif.attachmentPath || undefined,
      attachmentName: notif.attachmentName || undefined,
    }))
  ) as Array<{
    _id: string;
    title: string;
    message: string;
    priority: string;
    audience: string;
    sentAt?: string;
    attachmentPath?: string;
    attachmentName?: string;
  }>;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Send Notifications"
        description="Send announcements and notifications to parents"
      />

      <SendNotificationForm />

      <div className="rounded-lg bg-white/10 border border-white/20 p-6">
        <h3 className="font-semibold text-white mb-4">Recent Notifications</h3>
        <AdminNotificationsList notifications={items} />
      </div>
    </div>
  );
}
