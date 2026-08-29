"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, ExternalLink, CheckCircle2, Trash2 } from "lucide-react";
import {
  getNotificationAttachments,
  looksLikeHtml,
  sanitizeNotificationHtml,
  formatNotificationPlainText,
  notificationHasMissingUpload,
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
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  const allSelected = items.length > 0 && selectedIds.size === items.length;
  const someSelected = selectedIds.size > 0;

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((item) => item._id)));
    }
  }

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

  async function deleteNotifications(ids: string[]) {
    if (ids.length === 0) return;
    setDeleting(true);
    try {
      const response = await fetch("/api/parent/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationIds: ids }),
      });
      if (!response.ok) return;
      setSelectedIds((prev) => {
        const next = new Set(prev);
        ids.forEach((id) => next.delete(id));
        return next;
      });
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  function handleOpenAttachment(id: string, url: string) {
    if (!items.find((item) => item._id === id)?.read) {
      void markRead(id);
    }
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="space-y-4">
      {unreadCount > 0 && (
        <p className="rounded-lg bg-explore-orange/10 px-4 py-2 text-sm font-semibold text-explore-orange">
          {unreadCount} unread notification{unreadCount === 1 ? "" : "s"}
        </p>
      )}

      {items.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-explore-sand bg-white px-4 py-3">
          <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-explore-charcoal">
            <input
              type="checkbox"
              checked={allSelected}
              ref={(el) => {
                if (el) el.indeterminate = someSelected && !allSelected;
              }}
              onChange={toggleSelectAll}
              className="h-4 w-4 rounded border-explore-charcoal/30 text-explore-teal focus:ring-explore-teal"
            />
            {allSelected ? "Deselect all" : "Select all"}
          </label>
          {someSelected && (
            <button
              type="button"
              onClick={() => void deleteNotifications([...selectedIds])}
              disabled={deleting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
            >
              <Trash2 className="h-4 w-4" />
              {deleting ? "Deleting…" : `Delete selected (${selectedIds.size})`}
            </button>
          )}
        </div>
      )}

      {items.map((item) => {
        const attachments = getNotificationAttachments(
          item.attachmentPath,
          item.attachmentName,
          item.message
        );
        const missingUpload = notificationHasMissingUpload(
          item.attachmentPath,
          item.message
        );

        return (
          <article
            key={item._id}
            className={`rounded-xl p-5 shadow-sm ${item.read ? "bg-white" : "border-l-4 border-explore-orange bg-white"}`}
          >
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={selectedIds.has(item._id)}
                onChange={() => toggleSelect(item._id)}
                aria-label={`Select notification: ${item.title}`}
                className="mt-1 h-4 w-4 shrink-0 rounded border-explore-charcoal/30 text-explore-teal focus:ring-explore-teal"
              />
              <div className="min-w-0 flex-1">
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
                  <div className="flex shrink-0 items-center gap-2">
                    {item.read ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-explore-teal">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Read
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-explore-orange">New</span>
                    )}
                    <button
                      type="button"
                      onClick={() => void deleteNotifications([item._id])}
                      disabled={deleting}
                      aria-label="Delete notification"
                      className="rounded-lg p-1.5 text-explore-charcoal/40 hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {missingUpload && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                    This notification references a file that was not uploaded to the portal. Please
                    contact Explore More Academy if you need the document.
                  </div>
                )}

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
                          <button
                            type="button"
                            onClick={() => handleOpenAttachment(item._id, attachment.url)}
                            className="inline-flex items-center gap-2 rounded-lg bg-explore-teal px-4 py-2 text-sm font-semibold text-white hover:bg-explore-teal/90"
                          >
                            <ExternalLink className="h-4 w-4" />
                            {attachment.isPdf ? "View PDF" : "Open attachment"}
                          </button>
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
                    {formatNotificationPlainText(item.message, item.attachmentPath)}
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
              </div>
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
