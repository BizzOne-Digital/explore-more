"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader } from "lucide-react";

type Notification = {
  _id: string;
  type: string;
  title: string;
  body?: string;
  link?: string;
  readAt?: string;
  createdAt: string;
};

export default function TutorNotificationsPage() {
  const router = useRouter();
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const r = await fetch("/api/tutor/notifications");
        const json = await r.json();
        if (!cancelled) setItems(json.notifications ?? []);
        const hasUnread = (json.notifications ?? []).some(
          (n: Notification) => !n.readAt
        );
        if (hasUnread) {
          await fetch("/api/tutor/notifications", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ markAllRead: true }),
          });
          if (!cancelled) {
            setItems((prev) =>
              prev.map((n) => ({ ...n, readAt: n.readAt ?? new Date().toISOString() }))
            );
            router.refresh();
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  async function markAllRead() {
    await fetch("/api/tutor/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setItems((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
    router.refresh();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold">Notifications</h2>
          <p className="mt-1 text-sm text-gray-500">
            Messages, resources, sessions, and academy updates.
          </p>
        </div>
        <button
          type="button"
          onClick={markAllRead}
          className="rounded-lg border px-4 py-2 text-sm font-semibold"
        >
          Mark all read
        </button>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
          <p>No notifications yet.</p>
          <p className="mt-2 text-sm">
            You will see parent messages, new resources, and session reminders here.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((n) => (
            <li
              key={n._id}
              className={`rounded-2xl bg-white p-4 shadow-sm ${!n.readAt ? "border-l-4 border-violet-500" : ""}`}
            >
              <p className="font-semibold">{n.title}</p>
              {n.body && <p className="mt-1 text-sm text-gray-600">{n.body}</p>}
              <p className="mt-2 text-xs text-gray-400">{new Date(n.createdAt).toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
