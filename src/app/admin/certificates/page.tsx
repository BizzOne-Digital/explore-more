import connectDB from "@/lib/db";
import { Certificate } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize, formatDate } from "@/lib/admin/serialize";

async function getData() {
  await connectDB();
  const items = await Certificate.find().sort({ createdAt: -1 }).lean();
  return serialize(items);
}

export default async function Page() {
  const data = await getData();

  return (
    <div>
      <PageHeader
        title="Certificates"
        description="Issued certificates"
        
      />
      <DataTable
        columns={[
    { key: "title", header: "Title" },
    { key: "studentId", header: "Student ID" },
    { key: "issueDate", header: "Issued", render: (row) => formatDate(row.issueDate) },
    { key: "isShareable", header: "Shareable", render: (row) => row.isShareable ? "Yes" : "No" },
        ]}
        data={data}
        
        emptyMessage="No records found."
      />
    </div>
  );
}
