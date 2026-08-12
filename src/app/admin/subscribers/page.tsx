import connectDB from "@/lib/db";
import { NewsletterSubscriber } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize, formatDate } from "@/lib/admin/serialize";

async function getData() {
  await connectDB();
  const items = await NewsletterSubscriber.find().sort({ createdAt: -1 }).lean();
  return serialize(items);
}

export default async function Page() {
  const data = await getData();

  return (
    <div>
      <PageHeader
        title="Subscribers"
        description="Newsletter subscribers"
        
      />
      <DataTable
        columns={[
    { key: "email", header: "Email" },
    { key: "name", header: "Name" },
    { key: "verified", header: "Verified", render: (row) => row.verified ? "Yes" : "No" },
    { key: "unsubscribed", header: "Unsubscribed", render: (row) => row.unsubscribed ? "Yes" : "No" },
    { key: "createdAt", header: "Subscribed", render: (row) => formatDate(row.createdAt) },
        ]}
        data={data}
        
        emptyMessage="No records found."
      />
    </div>
  );
}
