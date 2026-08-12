import connectDB from "@/lib/db";
import { Testimonial } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize, formatDate } from "@/lib/admin/serialize";

async function getData() {
  await connectDB();
  const items = await Testimonial.find().sort({ createdAt: -1 }).lean();
  return serialize(items);
}

export default async function Page() {
  const data = await getData();

  return (
    <div>
      <PageHeader
        title="Testimonials"
        description="Customer testimonials"
        
      />
      <DataTable
        columns={[
    { key: "authorName", header: "Author" },
    { key: "authorRole", header: "Role" },
    { key: "rating", header: "Rating" },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={String(row.status)} /> },
        ]}
        data={data}
        
        emptyMessage="No records found."
      />
    </div>
  );
}
