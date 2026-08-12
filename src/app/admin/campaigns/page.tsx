import connectDB from "@/lib/db";
import { DonationCampaign } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize, formatDate, formatDateTime } from "@/lib/admin/serialize";
import { formatCents } from "@/lib/utils";

async function getData() {
  await connectDB();
  const items = await DonationCampaign.find().sort({ createdAt: -1 }).lean();
  return serialize(items);
}

export default async function Page() {
  const data = await getData();

  return (
    <div>
      <PageHeader
        title="Donation Campaigns"
        description="Manage fundraising campaigns"
        action={{ label: "New Campaign", href: "/admin/campaigns/new" }}
      />
      <DataTable
        columns={[
    { key: "title", header: "Title" },
    { key: "goalCents", header: "Goal", render: (row) => formatCents(row.goalCents as number) },
    { key: "raisedCents", header: "Raised", render: (row) => formatCents(row.raisedCents as number) },
    { key: "status", header: "Status", render: (row) => <StatusBadge status={String(row.status)} /> },
        ]}
        data={data}
        rowHref={(row) => "/admin/campaigns/" + String(row._id)}
        emptyMessage="No records found."
      />
    </div>
  );
}
