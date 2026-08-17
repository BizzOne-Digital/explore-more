import { PageHeader } from "@/components/admin/PageHeader";
import { SendNotificationForm } from "@/components/admin/SendNotificationForm";
import connectDB from "@/lib/db";
import { ParentNotification } from "@/models";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  await connectDB();

  const recentNotifications = await ParentNotification.find()
    .sort({ sentAt: -1 })
    .limit(10)
    .lean();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Send Notifications"
        description="Send announcements and notifications to parents"
      />

      {/* Send Form */}
      <SendNotificationForm />

      {/* Recent Notifications */}
      <div className="rounded-lg bg-white/10 border border-white/20 p-6">
        <h3 className="font-semibold text-white mb-4">Recent Notifications</h3>

        {recentNotifications.length > 0 ? (
          <div className="space-y-3">
            {recentNotifications.map((notif) => (
              <div
                key={notif._id.toString()}
                className="rounded-lg bg-white/5 border border-white/10 p-4"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-white">{notif.title}</h4>
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    notif.priority === "urgent" ? "bg-red-500/20 text-red-300" :
                    notif.priority === "important" ? "bg-yellow-500/20 text-yellow-300" :
                    "bg-blue-500/20 text-blue-300"
                  }`}>
                    {notif.priority}
                  </span>
                </div>
                <p className="text-sm text-white/70 mb-2 line-clamp-2">{notif.message}</p>
                <div className="flex items-center gap-4 text-xs text-white/50">
                  <span>Audience: {notif.audience}</span>
                  <span>•</span>
                  <span>
                    {notif.sentAt
                      ? format(new Date(notif.sentAt), "MMM dd, yyyy 'at' h:mm a")
                      : "Scheduled"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/60 text-center py-8">No notifications sent yet.</p>
        )}
      </div>
    </div>
  );
}
