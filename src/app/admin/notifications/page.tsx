import { SendNotificationForm } from "@/components/admin/SendNotificationForm";

export default function AdminSendNotificationsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-white mb-2">Send Notification</h1>
      <p className="text-sm text-white/50 mb-6">Send announcements to all parents or selected groups.</p>
      <SendNotificationForm />
    </div>
  );
}
