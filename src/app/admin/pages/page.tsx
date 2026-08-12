import connectDB from "@/lib/db";
import { Page as PageModel } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize, formatDate } from "@/lib/admin/serialize";

async function getData() {
  await connectDB();
  const items = await PageModel.find().sort({ key: 1 }).lean();
  return serialize(items);
}

export default async function AdminPagesPage() {
  const data = await getData();

  return (
    <div>
      <PageHeader
        title="Pages"
        description="Manage website page content"
        
      />
      <DataTable
        columns={[
    { key: "title", header: "Title" },
    { key: "key", header: "Key" },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={String(row.status)} /> },
    { key: "updatedAt", header: "Updated", render: (row) => formatDate(row.updatedAt) },
        ]}
        data={data}
        rowHref={(row) => "/admin/pages/" + String(row.key)}
        emptyMessage="No records found."
      />
    </div>
  );
}
