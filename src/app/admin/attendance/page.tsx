import connectDB from "@/lib/db";
import { Attendance } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize, formatDate } from "@/lib/admin/serialize";

async function getData() {
  await connectDB();
  const items = await Attendance.find().sort({ createdAt: -1 }).lean();
  return serialize(items);
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
    { key: "studentId", header: "Student ID" },
    { key: "sessionDate", header: "Session", render: (row) => formatDate(row.sessionDate) },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={String(row.status)} /> },
        ]}
        data={data}
        
        emptyMessage="No records found."
      />
    </div>
  );
}
