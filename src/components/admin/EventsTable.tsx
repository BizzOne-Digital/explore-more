"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate } from "@/lib/admin/serialize";

export type EventRow = {
  _id: string;
  title?: string;
  startDate?: string;
  location?: string;
  eventType?: string;
  status?: string;
  publishedToWebsite?: boolean;
};

export function EventsTable({ data }: { data: EventRow[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(e: React.MouseEvent, row: EventRow) {
    e.preventDefault();
    e.stopPropagation();

    const title = String(row.title ?? "this event");
    if (!confirm(`Delete "${title}"?\n\nThis permanently removes the event. This cannot be undone.`)) {
      return;
    }

    setDeletingId(row._id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/events/${row._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Delete failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  const columns: Column<EventRow>[] = [
    { key: "title", header: "Title" },
    { key: "startDate", header: "Start", render: (row) => formatDate(row.startDate) },
    { key: "location", header: "Location" },
    {
      key: "eventType",
      header: "Type",
      render: (row) => <span className="capitalize">{String(row.eventType ?? "—")}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={String(row.status)} />,
    },
    {
      key: "publishedToWebsite",
      header: "Website",
      render: (row) =>
        row.publishedToWebsite ? (
          <span className="text-xs text-green-400">✓ Published</span>
        ) : (
          <span className="text-xs text-white/40">Not published</span>
        ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      render: (row) => (
        <button
          type="button"
          onClick={(e) => handleDelete(e, row)}
          disabled={deletingId === row._id}
          className="rounded-lg p-2 text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
          title="Delete event"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      <DataTable
        columns={columns}
        data={data}
        rowHref={(row) => `/admin/events/${row._id}`}
        emptyMessage="No records found."
      />
    </div>
  );
}
