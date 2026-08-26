"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";

export type CourseRow = {
  _id: string;
  title?: string;
  instructor?: string;
  courseType?: string;
  priceAmount?: number;
  status?: string;
  publishedToWebsite?: boolean;
  enrollmentStatus?: string;
};

export function CoursesTable({ data }: { data: CourseRow[] }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(e: React.MouseEvent, row: CourseRow) {
    e.preventDefault();
    e.stopPropagation();

    const title = String(row.title ?? "this course");
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
      const res = await fetch(`/api/admin/courses/${row._id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Delete failed");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeletingId(null);
    }
  }

  const columns: Column<CourseRow>[] = [
    { key: "title", header: "Title" },
    { key: "instructor", header: "Instructor" },
    {
      key: "priceAmount",
      header: "Price",
      render: (row) =>
        row.courseType === "free" ? "Free" : `$${Number(row.priceAmount).toFixed(2)}`,
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
      key: "enrollmentStatus",
      header: "Enrollment",
      render: (row) => <StatusBadge status={String(row.enrollmentStatus)} />,
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
          title="Delete course"
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
        rowHref={(row) => `/admin/courses/${row._id}`}
        emptyMessage="No courses found for this grade."
      />
    </div>
  );
}
