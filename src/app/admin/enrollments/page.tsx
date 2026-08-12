import connectDB from "@/lib/db";
import { Enrollment } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize, formatDate } from "@/lib/admin/serialize";

async function getData() {
  await connectDB();
  const items = await Enrollment.find().sort({ createdAt: -1 }).lean();
  return serialize(items);
}

export default async function Page() {
  const data = await getData();

  return (
    <div>
      <PageHeader
        title="Enrollments"
        description="Course enrollments"
        
      />
      <DataTable
        columns={[
    { key: "courseId", header: "Course ID" },
    { key: "userId", header: "User ID" },
    { key: "progress", header: "Progress", render: (row) => String(row.progress) + "%" },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={String(row.status)} /> },
    { key: "enrolledAt", header: "Enrolled", render: (row) => formatDate(row.enrolledAt) },
        ]}
        data={data}
        
        emptyMessage="No records found."
      />
    </div>
  );
}
