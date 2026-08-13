"use client";

import { useRouter } from "next/navigation";

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  priority: string;
  sentAt?: string;
  requiresAcknowledgment: boolean;
  read: boolean;
  acknowledged: boolean;
  sentBy?: { name?: string };
}

export function NotificationsClient({ items, unreadCount }: { items: NotificationItem[]; unreadCount: number }) {
  const router = useRouter();

  async function markRead(id: string, acknowledge = false) {
    await fetch("/api/parent/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notificationId: id, acknowledge }),
    });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <p className="rounded-lg bg-explore-orange/10 px-4 py-2 text-sm font-semibold text-explore-orange">
          {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
        </p>
      )}
      {items.map((item) => (
        <article
          key={item._id}
          className={`rounded-xl p-5 shadow-sm ${item.read ? "bg-white" : "border-l-4 border-explore-orange bg-white"}`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              {item.priority !== "normal" && (
                <span className="mb-1 inline-block rounded-full bg-explore-orange/20 px-2 py-0.5 text-xs font-semibold uppercase text-explore-orange">
                  {item.priority}
                </span>
              )}
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-xs text-explore-charcoal/50">
                {item.sentBy?.name ?? "Explore More Academy"} ·{" "}
                {item.sentAt ? new Date(item.sentAt).toLocaleString() : ""}
              </p>
            </div>
            {!item.read && <span className="text-xs font-semibold text-explore-orange">New</span>}
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm text-explore-charcoal/80">{item.message}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {!item.read && (
              <button
                type="button"
                onClick={() => markRead(item._id)}
                className="rounded-lg bg-explore-sand px-3 py-1.5 text-xs font-semibold"
              >
                Mark as Read
              </button>
            )}
            {item.requiresAcknowledgment && !item.acknowledged && (
              <button
                type="button"
                onClick={() => markRead(item._id, true)}
                className="rounded-lg bg-explore-teal px-3 py-1.5 text-xs font-semibold text-white"
              >
                I Have Read This Notification
              </button>
            )}
          </div>
        </article>
      ))}
      {items.length === 0 && (
        <p className="rounded-xl bg-white p-8 text-center text-sm text-explore-charcoal/60">No notifications yet.</p>
      )}
    </div>
  );
}
