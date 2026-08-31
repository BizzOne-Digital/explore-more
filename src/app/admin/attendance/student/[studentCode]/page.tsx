import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AttendanceSearchForm } from "@/components/admin/AttendanceSearchForm";
import { getStudentAttendanceHistory } from "@/lib/admin/attendance-queries";
import { formatDate, serialize } from "@/lib/admin/serialize";
import { formatAttendanceStatus } from "@/lib/attendance/status";

type PageProps = {
  params: Promise<{ studentCode: string }>;
};

export default async function StudentAttendanceHistoryPage({ params }: PageProps) {
  const { studentCode } = await params;
  const data = await getStudentAttendanceHistory(studentCode);

  if (!data) notFound();

  const rows = serialize(data.rows);

  return (
    <div className="space-y-6">
      <Link
        href="/admin/attendance"
        className="inline-flex items-center gap-2 text-sm text-white/60 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to attendance
      </Link>

      <PageHeader
        title={`Attendance — ${data.student.name}`}
        description={`Student ID ${data.student.studentId} · ${rows.length} record${rows.length === 1 ? "" : "s"}`}
      />

      <AttendanceSearchForm />

      <DataTable
        columns={[
          {
            key: "sessionDate",
            header: "Date",
            render: (row) => formatDate(row.sessionDate),
          },
          {
            key: "classLabel",
            header: "Program / Class",
            render: (row) => row.classLabel ?? "—",
          },
          {
            key: "recordedByName",
            header: "Tutor / Staff",
            render: (row) => row.recordedByName ?? "—",
          },
          {
            key: "status",
            header: "Status",
            render: (row) => (
              <StatusBadge status={formatAttendanceStatus(row.status, row.notes)} />
            ),
          },
          {
            key: "notes",
            header: "Notes",
            render: (row) => (
              <span className="text-sm text-white/70">{row.notes?.trim() || "—"}</span>
            ),
          },
        ]}
        data={rows}
        emptyMessage="No attendance records for this student."
      />
    </div>
  );
}
