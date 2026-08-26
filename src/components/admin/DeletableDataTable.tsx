"use client";

import { useState, type MouseEvent } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { DataTable, type Column } from "./DataTable";

interface DeletableDataTableProps<T extends { _id: string }> {
  data: T[];
  columns: Column<T>[];
  rowHref: (row: T) => string;
  deleteUrl: (row: T) => string;
  itemLabel?: (row: T) => string;
  emptyMessage?: string;
}

export function DeletableDataTable<T extends { _id: string }>({
  data,
  columns,
  rowHref,
  deleteUrl,
  itemLabel,
  emptyMessage,
}: DeletableDataTableProps<T>) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(e: MouseEvent, row: T) {
    e.preventDefault();
    e.stopPropagation();

    const label = itemLabel?.(row) ?? "this item";
    if (
      !confirm(
        `Delete "${label}"?\n\nThis permanently removes it from admin and the public website. This cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(row._id);
    setError(null);

    try {
      const res = await fetch(deleteUrl(row), { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Delete failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  const columnsWithDelete: Column<T>[] = [
    ...columns,
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
          title="Delete permanently"
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
        columns={columnsWithDelete}
        data={data}
        rowHref={rowHref}
        emptyMessage={emptyMessage}
      />
    </div>
  );
}
