"use client";

import { useEffect, useState } from "react";
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
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tutor/notifications")
      .then((r) => r.json())
      .then((json) => setItems(json.notifications ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function markAllRead() {
    await fetch("/api/tutor/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAllRead: true }),
    });
    setItems((prev) => prev.map((n) => ({ ...n, readAt: new Date().toISOString() })));
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
