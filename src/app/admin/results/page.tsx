import connectDB from "@/lib/db";
import { Result } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize, formatDate } from "@/lib/admin/serialize";

async function getData() {
  await connectDB();
  const items = await Result.find().sort({ createdAt: -1 }).lean();
  return serialize(items);
}

export default async function Page() {
  const data = await getData();

  return (
    <div>
      <PageHeader
        title="Results"
        description="Student assessment results"
        
      />
      <DataTable
        columns={[
    { key: "subject", header: "Subject" },
    { key: "assessment", header: "Assessment" },
    { key: "grade", header: "Grade" },
    { key: "publishedToStudent", header: "Published", render: (row) => row.publishedToStudent ? "Yes" : "No" },
    { key: "date", header: "Date", render: (row) => formatDate(row.date) },
        ]}
        data={data}
        
        emptyMessage="No records found."
      />
    </div>
  );
}
