import connectDB from "@/lib/db";
import { Program } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize, formatDate } from "@/lib/admin/serialize";

async function getData() {
  await connectDB();
  const items = await Program.find().sort({ listingOrder: 1 }).lean();
  return serialize(items);
}

export default async function Page() {
  const data = await getData();

  return (
    <div>
      <PageHeader
        title="Programs"
        description="Manage adventure programs"
        action={{ label: "New Program", href: "/admin/programs/new" }}
      />
      <DataTable
        columns={[
    { key: "title", header: "Title" },
    { key: "tagline", header: "Tagline" },
    { key: "ageRange", header: "Age Range" },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={String(row.status)} /> },
        ]}
        data={data}
        rowHref={(row) => "/admin/programs/" + String(row._id)}
        emptyMessage="No records found."
      />
    </div>
  );
}
