"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { formatGradeLabel } from "@/lib/grades";

export type ProgramRow = {
  _id: string;
  title?: string;
  tagline?: string;
  grade?: string;
  status?: string;
};

export function ProgramsTable({ data }: { data: ProgramRow[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(e: React.MouseEvent, row: ProgramRow) {
    e.preventDefault();
    e.stopPropagation();

    const title = String(row.title ?? "this program");
    if (
      !confirm(
        `Delete "${title}"?\n\nThis permanently removes it from admin and the public website. This cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(row._id);
    setError(null);

    try {
      const res = await fetch(`/api/admin/programs/${row._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Delete failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  const columns: Column<ProgramRow>[] = [
    { key: "title", header: "Title" },
    { key: "tagline", header: "Tagline" },
    {
      key: "grade",
      header: "Grade",
      render: (row) => formatGradeLabel(String(row.grade ?? "")),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={String(row.status)} />,
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
          title="Delete program"
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
        rowHref={(row) => `/admin/programs/${row._id}`}
        emptyMessage="No programs found for this grade."
      />
    </div>
  );
}
