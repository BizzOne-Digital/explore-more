"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";

export type BookRow = {
  _id: string;
  title?: string;
  coverImage?: string;
  author?: string;
  priceAmount?: number;
  status?: string;
  publishedToWebsite?: boolean;
  stockStatus?: string;
  inventory?: number;
};

export function BooksTable({ data }: { data: BookRow[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(e: React.MouseEvent, row: BookRow) {
    e.preventDefault();
    e.stopPropagation();

    const title = String(row.title ?? "this book");
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
      const res = await fetch(`/api/admin/books/${row._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Delete failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  const columns: Column<BookRow>[] = [
    {
      key: "coverImage",
      header: "Cover",
      render: (row) =>
        row.coverImage ? (
          <Image
            src={String(row.coverImage)}
            alt=""
            width={36}
            height={48}
            className="h-12 w-9 rounded object-cover bg-explore-sand"
          />
        ) : (
          "—"
        ),
    },
    { key: "title", header: "Title" },
    { key: "author", header: "Author" },
    {
      key: "priceAmount",
      header: "Price",
      render: (row) => `$${Number(row.priceAmount).toFixed(2)}`,
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
      key: "stockStatus",
      header: "Stock",
      render: (row) => <StatusBadge status={String(row.stockStatus)} />,
    },
    { key: "inventory", header: "Qty" },
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
          title="Delete book"
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
        rowHref={(row) => `/admin/books/${row._id}`}
        emptyMessage="No records found."
      />
    </div>
  );
}
