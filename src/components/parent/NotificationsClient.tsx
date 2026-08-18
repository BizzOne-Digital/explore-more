"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ExternalLink, CheckCircle2 } from "lucide-react";
import {
  getNotificationAttachments,
  looksLikeHtml,
  sanitizeNotificationHtml,
} from "@/lib/notifications/display";

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  priority: string;
  sentAt?: string;
  readAt?: string;
  requiresAcknowledgment: boolean;
  read: boolean;
  acknowledged: boolean;
  attachmentPath?: string;
  attachmentName?: string;
  sentBy?: { name?: string };
}

export function NotificationsClient({
  items,
  unreadCount,
}: {
  items: NotificationItem[];
  unreadCount: number;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function markRead(id: string, acknowledge = false) {
    setBusyId(id);
    try {
      await fetch("/api/parent/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: id, acknowledge }),
      });
      router.refresh();
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <p className="rounded-lg bg-explore-orange/10 px-4 py-2 text-sm font-semibold text-explore-orange">
          {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
        </p>
      )}
      {items.map((item) => {
        const attachments = getNotificationAttachments(
          item.attachmentPath,
          item.attachmentName,
          item.message
        );

        return (
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
              {item.read ? (
                <span className="inline-flex items-center gap-1 text-xs font-semibold text-explore-teal">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Read
                </span>
              ) : (
                <span className="text-xs font-semibold text-explore-orange">New</span>
              )}
            </div>

            {attachments.length > 0 && (
              <div className="mt-4 space-y-2">
                {attachments.map((attachment) => (
                  <div
                    key={attachment.url}
                    className="rounded-lg border border-explore-teal/20 bg-explore-teal/5 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm font-medium text-explore-charcoal">
                        <FileText className="h-5 w-5 shrink-0 text-explore-teal" />
                        {attachment.name}
                      </div>
                      <a
                        href={attachment.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 rounded-lg bg-explore-teal px-4 py-2 text-sm font-semibold text-white hover:bg-explore-teal/90"
                      >
                        <ExternalLink className="h-4 w-4" />
                        {attachment.isPdf ? "View PDF" : "Open attachment"}
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {looksLikeHtml(item.message) ? (
              <div
                className="notification-body mt-3 text-sm text-explore-charcoal/80 [&_a]:text-explore-teal [&_a]:underline [&_img]:max-w-full [&_p]:mb-2"
                dangerouslySetInnerHTML={{ __html: sanitizeNotificationHtml(item.message) }}
              />
            ) : (
              <p className="mt-3 whitespace-pre-wrap text-sm text-explore-charcoal/80">
                {item.message}
              </p>
            )}

            <div className="mt-4 flex flex-wrap items-center gap-2">
              {!item.read && (
                <button
                  type="button"
                  onClick={() => void markRead(item._id)}
                  disabled={busyId === item._id}
                  className="rounded-lg bg-explore-sand px-3 py-1.5 text-xs font-semibold disabled:opacity-60"
                >
                  {busyId === item._id ? "Saving…" : "Mark as Read"}
                </button>
              )}
              {item.read && item.readAt && (
                <p className="text-xs text-explore-charcoal/50">
                  Marked read {new Date(item.readAt).toLocaleString()}
                </p>
              )}
              {item.requiresAcknowledgment && !item.acknowledged && (
                <button
                  type="button"
                  onClick={() => void markRead(item._id, true)}
                  disabled={busyId === item._id}
                  className="rounded-lg bg-explore-teal px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                >
                  I Have Read This Notification
                </button>
              )}
              {item.acknowledged && (
                <p className="text-xs font-medium text-explore-teal">Acknowledged</p>
              )}
            </div>
          </article>
        );
      })}
      {items.length === 0 && (
        <p className="rounded-xl bg-white p-8 text-center text-sm text-explore-charcoal/60">
          No notifications yet.
        </p>
      )}
    </div>
  );
}
