import connectDB from "@/lib/db";
import { DonationCampaign } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { CampaignsTable, type CampaignRow } from "@/components/admin/CampaignsTable";
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
      <CampaignsTable data={data as unknown as CampaignRow[]} />
    </div>
  );
}
