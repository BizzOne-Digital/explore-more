"use client";

import { useCallback, useEffect, useState } from "react";

type FeedbackRow = {
  _id: string;
  category: string;
  message: string;
  createdAt: string;
  reviewedAt?: string;
  teacher?: { name?: string; email?: string } | null;
};

export function TeacherFeedbackAdminClient() {
  const [items, setItems] = useState<FeedbackRow[]>([]);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    const q = unreadOnly ? "?unread=1" : "";
    fetch(`/api/admin/teacher-feedback${q}`)
      .then((r) => r.json())
      .then((json) => setItems(json.data?.items ?? json.items ?? []))
      .finally(() => setLoading(false));
  }, [unreadOnly]);

  useEffect(() => {
    queueMicrotask(() => load());
  }, [load]);

  const markReviewed = async (id: string) => {
    await fetch("/api/admin/teacher-feedback", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, reviewed: true }),
    });
    load();
  };

  return (
    <div className="space-y-4">
      <label className="flex items-center gap-2 text-sm text-white/80">
        <input
          type="checkbox"
          checked={unreadOnly}
          onChange={(e) => setUnreadOnly(e.target.checked)}
        />
        Unread only
      </label>

      {loading ? (
        <p className="text-sm text-white/60">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-sm text-white/60">No teacher feedback yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((row) => (
            <li
              key={row._id}
              className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-white/90"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {row.teacher?.name ?? "Teacher"}{" "}
                    <span className="text-white/50">({row.category})</span>
                  </p>
                  <p className="text-xs text-white/50">
                    {row.teacher?.email} · {new Date(row.createdAt).toLocaleString()}
                  </p>
                </div>
                {!row.reviewedAt && (
                  <button
                    type="button"
                    onClick={() => markReviewed(row._id)}
                    className="rounded-lg bg-explore-teal px-3 py-1 text-xs font-medium text-white"
                  >
                    Mark reviewed
                  </button>
                )}
              </div>
              <p className="mt-3 whitespace-pre-wrap text-white/80">{row.message}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
