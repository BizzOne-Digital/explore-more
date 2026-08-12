import connectDB from "@/lib/db";
import { Course } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize, formatDate, formatDateTime } from "@/lib/admin/serialize";
import { formatCents } from "@/lib/utils";

async function getData() {
  await connectDB();
  const items = await Course.find().sort({ createdAt: -1 }).lean();
  return serialize(items);
}

export default async function Page() {
  const data = await getData();

  return (
    <div>
      <PageHeader
        title="Courses"
        description="Manage courses and curriculum"
        action={{ label: "New Course", href: "/admin/courses/new" }}
      />
      <DataTable
        columns={[
    { key: "title", header: "Title" },
    { key: "instructor", header: "Instructor" },
    { key: "priceCents", header: "Price", render: (row) => (row.isFree as boolean) ? "Free" : formatCents(row.priceCents as number) },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={String(row.status)} /> },
        ]}
        data={data}
        rowHref={(row) => "/admin/courses/" + String(row._id)}
        emptyMessage="No records found."
      />
    </div>
  );
}
