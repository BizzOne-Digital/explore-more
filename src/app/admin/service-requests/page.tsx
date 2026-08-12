import connectDB from "@/lib/db";
import { ServiceRequest } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize, formatDate } from "@/lib/admin/serialize";

async function getData() {
  await connectDB();
  const items = await ServiceRequest.find().sort({ createdAt: -1 }).lean();
  return serialize(items);
}

export default async function Page() {
  const data = await getData();

  return (
    <div>
      <PageHeader
        title="Service Requests"
        description="Program inquiry requests"
        
      />
      <DataTable
        columns={[
    { key: "studentName", header: "Student" },
    { key: "parentName", header: "Parent" },
    { key: "email", header: "Email" },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={String(row.status)} /> },
    { key: "createdAt", header: "Submitted", render: (row) => formatDate(row.createdAt) },
        ]}
        data={data}
        
        emptyMessage="No records found."
      />
    </div>
  );
}
