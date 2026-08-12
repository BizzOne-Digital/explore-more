import connectDB from "@/lib/db";
import { GalleryImage } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize, formatDate } from "@/lib/admin/serialize";

async function getData() {
  await connectDB();
  const items = await GalleryImage.find().sort({ createdAt: -1 }).lean();
  return serialize(items);
}

export default async function Page() {
  const data = await getData();

  return (
    <div>
      <PageHeader
        title="Gallery"
        description="Gallery images"
        
      />
      <DataTable
        columns={[
    { key: "title", header: "Title" },
    { key: "featured", header: "Featured", render: (row) => row.featured ? "Yes" : "No" },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={String(row.status)} /> },
    { key: "order", header: "Order" },
        ]}
        data={data}
        
        emptyMessage="No records found."
      />
    </div>
  );
}
