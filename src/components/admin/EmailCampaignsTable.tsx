"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatDate } from "@/lib/admin/serialize";
import { Mail, Bell } from "lucide-react";

export type CampaignRow = {
  _id: string;
  subject?: string;
  deliveryMethod?: string;
  priority?: string;
  recipientCount?: number;
  sentCount?: number;
  failedCount?: number;
  status?: string;
  sentAt?: string;
};

const priorityBadge = (priority: string) => {
  const colors = {
    normal: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    important: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
    urgent: "bg-red-500/10 text-red-400 border-red-500/30",
  };
  const icons = { normal: "📢", important: "⚠️", urgent: "🚨" };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${colors[priority as keyof typeof colors] || colors.normal}`}
    >
      {icons[priority as keyof typeof icons]} {priority}
    </span>
  );
};

const deliveryBadge = (method: string) => {
  if (method === "both") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-white/60">
        <Mail className="h-3 w-3" /> + <Bell className="h-3 w-3" />
      </span>
    );
  }
  if (method === "notification") {
    return <Bell className="h-4 w-4 text-white/60" />;
  }
  return <Mail className="h-4 w-4 text-white/60" />;
};

export function EmailCampaignsTable({ data }: { data: CampaignRow[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(e: React.MouseEvent, row: CampaignRow) {
    e.preventDefault();
    e.stopPropagation();

    const subject = String(row.subject ?? "this campaign");
    if (
      !confirm(
        `Delete "${subject}"?\n\nThis permanently removes the campaign record. This cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(row._id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/email-campaigns/${row._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Delete failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  const columns: Column<CampaignRow>[] = [
    { key: "subject", header: "Subject" },
    {
      key: "deliveryMethod",
      header: "Delivery",
      render: (row) => deliveryBadge(String(row.deliveryMethod || "email")),
    },
    {
      key: "priority",
      header: "Priority",
      render: (row) => priorityBadge(String(row.priority || "normal")),
    },
    {
      key: "recipientCount",
      header: "Recipients",
      render: (row) => (
        <div className="text-sm">
          <div className="font-medium text-white">{row.recipientCount ?? 0}</div>
          {(row.sentCount ?? 0) > 0 && (
            <div className="text-xs text-white/60">
              {row.sentCount} sent
              {(row.failedCount ?? 0) > 0 ? `, ${row.failedCount} failed` : ""}
            </div>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={String(row.status)} />,
    },
    {
      key: "sentAt",
      header: "Sent",
      render: (row) => (row.sentAt ? formatDate(String(row.sentAt)) : "-"),
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
          title="Delete campaign"
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
        rowHref={(row) => `/admin/email-campaigns/${row._id}`}
        emptyMessage="No campaigns found. Create your first campaign to get started."
      />
    </div>
  );
}
