import connectDB from "@/lib/db";
import { EmailCampaign } from "@/models";
import { EmailCampaignForm } from "@/components/admin/forms/EmailCampaignForm";
import { toAdminRecord } from "@/lib/admin/serialize";
import { notFound } from "next/navigation";

export default async function EditEmailCampaignPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();
  const campaign = await EmailCampaign.findById(id).lean();
  if (!campaign) notFound();
  return <EmailCampaignForm initialData={toAdminRecord(campaign)} />;
}
