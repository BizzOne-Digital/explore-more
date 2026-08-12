import connectDB from "@/lib/db";
import { FAQ } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize, formatDate } from "@/lib/admin/serialize";

async function getData() {
  await connectDB();
  const items = await FAQ.find().sort({ order: 1 }).lean();
  return serialize(items);
}

export default async function Page() {
  const data = await getData();

  return (
    <div>
      <PageHeader
        title="FAQs"
        description="Frequently asked questions"
        
      />
      <DataTable
        columns={[
    { key: "question", header: "Question" },
    { key: "category", header: "Category" },
    { key: "order", header: "Order" },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={String(row.status)} /> },
        ]}
        data={data}
        
        emptyMessage="No records found."
      />
    </div>
  );
}
