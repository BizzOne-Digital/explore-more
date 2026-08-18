import connectDB from "@/lib/db";
import { EmailCampaign } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { EmailCampaignsTable, type CampaignRow } from "@/components/admin/EmailCampaignsTable";
import { serialize } from "@/lib/admin/serialize";

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
        description="Create and manage email campaigns and notifications for parents"
        action={{ label: "New Campaign", href: "/admin/email-campaigns/new" }}
      />
      <EmailCampaignsTable data={data as unknown as CampaignRow[]} />
    </div>
  );
}
