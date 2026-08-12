import connectDB from "@/lib/db";
import { EventRegistration } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize, formatDate } from "@/lib/admin/serialize";

async function getData() {
  await connectDB();
  const items = await EventRegistration.find().sort({ createdAt: -1 }).lean();
  return serialize(items);
}

export default async function Page() {
  const data = await getData();

  return (
    <div>
      <PageHeader
        title="Event Registrations"
        description="View and manage event registrations"
        
      />
      <DataTable
        columns={[
    { key: "studentName", header: "Student" },
    { key: "guardianEmail", header: "Guardian Email" },
    { key: "paymentStatus", header: "Payment", render: (row) => <StatusBadge status={String(row.paymentStatus)} /> },
    { key: "checkedIn", header: "Checked In", render: (row) => row.checkedIn ? "Yes" : "No" },
    { key: "createdAt", header: "Registered", render: (row) => formatDate(row.createdAt) },
        ]}
        data={data}
        
        emptyMessage="No records found."
      />
    </div>
  );
}
