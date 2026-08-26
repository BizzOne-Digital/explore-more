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

function mapCampaignRows(
  raw: Array<Record<string, unknown>>
): CampaignRow[] {
  return raw.map((item) => ({
    _id: String(item._id),
    title: item.title as string | undefined,
    goalAmount: item.goalAmount as number | undefined,
    raisedAmount: item.raisedAmount as number | undefined,
    status: item.status as string | undefined,
    publishedToWebsite: item.publishedToWebsite as boolean | undefined,
  }));
}

export default async function Page() {
  let data: CampaignRow[] = [];
  let loadError: string | null = null;

  try {
    data = mapCampaignRows((await getData()) as unknown as Array<Record<string, unknown>>);
  } catch (error) {
    console.error("[admin/campaigns]", error);
    loadError = "Could not load campaigns. Check database connection and try again.";
  }

  return (
    <div>
      <PageHeader
        title="Donation Campaigns"
        description="Manage fundraising campaigns"
        action={{ label: "New Campaign", href: "/admin/campaigns/new" }}
      />
      {loadError ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {loadError}
        </div>
      ) : (
        <CampaignsTable data={data} />
      )}
    </div>
  );
}
