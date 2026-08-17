import connectDB from "@/lib/db";
import { DonationCampaign } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { serialize } from "@/lib/admin/serialize";

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
          { key: "goalAmount", header: "Goal", render: (row) => `$${Number(row.goalAmount).toFixed(2)}` },
          { key: "raisedAmount", header: "Raised", render: (row) => `$${Number(row.raisedAmount || 0).toFixed(2)}` },
          { 
            key: "progress", 
            header: "Progress", 
            render: (row) => {
              const goal = Number(row.goalAmount) || 1;
              const raised = Number(row.raisedAmount) || 0;
              const percent = Math.min(100, Math.round((raised / goal) * 100));
              return `${percent}%`;
            }
          },
          { key: "status", header: "Status", render: (row) => <StatusBadge status={String(row.status)} /> },
          { 
            key: "publishedToWebsite", 
            header: "Website", 
            render: (row) => (
              row.publishedToWebsite ? (
                <span className="text-xs text-green-400">✓ Published</span>
              ) : (
                <span className="text-xs text-white/40">Not published</span>
              )
            )
          },
        ]}
        data={data}
        rowHref={(row) => "/admin/campaigns/" + String(row._id)}
        emptyMessage="No records found."
      />
    </div>
  );
}
