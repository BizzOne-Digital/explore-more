import connectDB from "@/lib/db";
import { DonationCampaign } from "@/models";
import { CampaignForm } from "@/components/admin/forms/CampaignForm";
import { toAdminRecord } from "@/lib/admin/serialize";
import { notFound } from "next/navigation";

export default async function EditCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();
  const campaign = await DonationCampaign.findById(id).lean();
  if (!campaign) notFound();
  return <CampaignForm initialData={toAdminRecord(campaign)} />;
}
