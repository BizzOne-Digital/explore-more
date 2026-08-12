import connectDB from "@/lib/db";
import { EmailCampaign } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize, formatDate } from "@/lib/admin/serialize";

async function getData() {
  await connectDB();
  const items = await EmailCampaign.find().sort({ createdAt: -1 }).lean();
  return serialize(items);
}

export default async function Page() {
  const data = await getData();

  return (
    <div>
      <PageHeader
        title="Email Campaigns"
        description="Bulk email campaigns"
        action={{ label: "New Campaign", href: "/admin/email-campaigns/new" }}
      />
      <DataTable
        columns={[
    { key: "subject", header: "Subject" },
    { key: "type", header: "Type" },
    { key: "recipientCount", header: "Recipients" },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={String(row.status)} /> },
        ]}
        data={data}
        rowHref={(row) => "/admin/email-campaigns/" + String(row._id)}
        emptyMessage="No records found."
      />
    </div>
  );
}
