import connectDB from "@/lib/db";
import { User } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize, formatDate } from "@/lib/admin/serialize";

async function getData() {
  await connectDB();
  const items = await User.find({ role: "student" }).sort({ createdAt: -1 }).lean();
  return serialize(items);
}

export default async function Page() {
  const data = await getData();

  return (
    <div>
      <PageHeader
        title="Students"
        description="Student accounts and profiles"
        
      />
      <DataTable
        columns={[
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "emailVerified", header: "Verified", render: (row) => row.emailVerified ? "Yes" : "No" },
    { key: "isActive", header: "Active", render: (row) => row.isActive ? "Yes" : "No" },
    { key: "createdAt", header: "Joined", render: (row) => formatDate(row.createdAt) },
        ]}
        data={data}
        rowHref={(row) => "/admin/students/" + String(row._id)}
        emptyMessage="No records found."
      />
    </div>
  );
}
