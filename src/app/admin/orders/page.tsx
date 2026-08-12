import connectDB from "@/lib/db";
import { Order } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize, formatDate, formatDateTime } from "@/lib/admin/serialize";
import { formatCents } from "@/lib/utils";

async function getData() {
  await connectDB();
  const items = await Order.find().sort({ createdAt: -1 }).lean();
  return serialize(items);
}

export default async function Page() {
  const data = await getData();

  return (
    <div>
      <PageHeader
        title="Orders"
        description="Bookstore orders"
        
      />
      <DataTable
        columns={[
    { key: "orderNumber", header: "Order #" },
    { key: "customerName", header: "Customer" },
    { key: "totalCents", header: "Total", render: (row) => formatCents(row.totalCents as number) },
    { key: "paymentStatus", header: "Status", render: (row) => <StatusBadge status={String(row.paymentStatus)} /> },
    { key: "createdAt", header: "Date", render: (row) => formatDate(row.createdAt) },
        ]}
        data={data}
        
        emptyMessage="No records found."
      />
    </div>
  );
}
