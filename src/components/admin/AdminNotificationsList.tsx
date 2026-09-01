"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import { NotificationAttachmentRepair } from "@/components/admin/NotificationAttachmentRepair";

export interface AdminNotificationItem {
  _id: string;
  title: string;
  message: string;
  priority: string;
  audience: string;
  sentAt?: string;
  attachmentPath?: string;
  attachmentName?: string;
}

export function AdminNotificationsList({
  notifications,
}: {
  notifications: AdminNotificationItem[];
}) {
  const router = useRouter();
  const [items, setItems] = useState(notifications);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setItems(notifications);
  }, [notifications]);

  async function handleDelete(notification: AdminNotificationItem) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${notification.title}"? It will be removed from all parent accounts.`
    );
    if (!confirmed) return;

    setDeletingId(notification._id);
    setError("");

    try {
      const response = await fetch(`/api/admin/notifications/${notification._id}`, {
        method: "DELETE",
        credentials: "same-origin",
      });

      const rawText = await response.text();
      let data: { success?: boolean; error?: string } | null = null;
      if (rawText) {
        try {
          data = JSON.parse(rawText) as { success?: boolean; error?: string };
        } catch {
          data = null;
        }
      }

      if (!response.ok || data?.success === false) {
        throw new Error(
          data?.error ??
            (rawText.trim() ? rawText.trim().slice(0, 200) : "Failed to delete notification")
        );
      }

      setItems((current) => current.filter((item) => item._id !== notification._id));
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete notification");
    } finally {
      setDeletingId(null);
    }
  }

  if (items.length === 0) {
    return <p className="text-white/60 text-center py-8">No notifications sent yet.</p>;
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {items.map((notif) => (
        <div
          key={notif._id}
          className="rounded-lg bg-white/5 border border-white/10 p-4"
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <h4 className="font-medium text-white">{notif.title}</h4>
            <div className="flex items-center gap-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  notif.priority === "urgent"
                    ? "bg-red-500/20 text-red-300"
                    : notif.priority === "important"
                      ? "bg-yellow-500/20 text-yellow-300"
                      : "bg-blue-500/20 text-blue-300"
                }`}
              >
                {notif.priority}
              </span>
              <button
                type="button"
                onClick={() => void handleDelete(notif)}
                disabled={deletingId === notif._id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/30 px-2.5 py-1.5 text-xs font-semibold text-red-300 hover:bg-red-500/20 disabled:opacity-50"
                aria-label={`Delete notification ${notif.title}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {deletingId === notif._id ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
          <p className="text-sm text-white/70 mb-2 line-clamp-2">{notif.message}</p>
          <NotificationAttachmentRepair
            notificationId={notif._id}
            title={notif.title}
            attachmentPath={notif.attachmentPath}
            attachmentName={notif.attachmentName}
            message={notif.message}
          />
          <div className="mt-2 flex items-center gap-4 text-xs text-white/50">
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
  );
}
