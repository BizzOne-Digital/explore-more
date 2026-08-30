import connectDB from "@/lib/db";
import { Attendance } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize, formatDate } from "@/lib/admin/serialize";
import { ensureStudentUserId } from "@/lib/students/id";

type AttendanceRow = {
  _id: string;
  studentId: string;
  studentName?: string;
  sessionDate: string;
  status: string;
};

async function getData(): Promise<AttendanceRow[]> {
  await connectDB();
  const items = await Attendance.find()
    .populate("studentId", "name studentId")
    .sort({ createdAt: -1 })
    .lean();

  const rows: AttendanceRow[] = [];

  for (const item of items) {
    const student = item.studentId as
      | { _id?: { toString(): string }; name?: string; studentId?: string }
      | null;

    let displayStudentId = student?.studentId;
    if (student?._id && (!displayStudentId || displayStudentId.length > 8)) {
      displayStudentId = await ensureStudentUserId(student._id.toString());
    }

    rows.push({
      _id: item._id.toString(),
      studentId: displayStudentId ?? "—",
      studentName: student?.name,
      sessionDate: item.sessionDate instanceof Date ? item.sessionDate.toISOString() : String(item.sessionDate),
      status: item.status,
    });
  }

  return serialize(rows);
}

export default async function Page() {
  const data = await getData();

  return (
    <div>
      <PageHeader
        title="Attendance"
        description="Attendance records"
        
      />
      <DataTable
        columns={[
    {
      key: "studentId",
      header: "Student ID",
      render: (row) => (
        <div>
          <p className="font-mono text-explore-teal">{row.studentId}</p>
          {row.studentName ? (
            <p className="text-xs text-white/50">{row.studentName}</p>
          ) : null}
        </div>
      ),
    },
    { key: "sessionDate", header: "Session", render: (row) => formatDate(row.sessionDate) },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={String(row.status)} /> },
        ]}
        data={data}
        
        emptyMessage="No records found."
      />
    </div>
  );
}
