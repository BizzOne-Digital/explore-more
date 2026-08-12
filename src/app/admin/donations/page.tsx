import connectDB from "@/lib/db";
import { Donation } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize, formatDate, formatDateTime } from "@/lib/admin/serialize";
import { formatCents } from "@/lib/utils";

async function getData() {
  await connectDB();
  const items = await Donation.find().sort({ createdAt: -1 }).lean();
  return serialize(items);
}

export default async function Page() {
  const data = await getData();

  return (
    <div>
      <PageHeader
        title="Donations"
        description="Donation records"
        
      />
      <DataTable
        columns={[
    { key: "donorName", header: "Donor" },
    { key: "donorEmail", header: "Email" },
    { key: "amountCents", header: "Amount", render: (row) => formatCents(row.amountCents as number) },
    { key: "paymentStatus", header: "Status", render: (row) => <StatusBadge status={String(row.paymentStatus)} /> },
    { key: "createdAt", header: "Date", render: (row) => formatDate(row.createdAt) },
        ]}
        data={data}
        
        emptyMessage="No records found."
      />
    </div>
  );
}
