import connectDB from "@/lib/db";
import { EmailCampaign } from "@/models";
import { EmailCampaignForm } from "@/components/admin/forms/EmailCampaignForm";
import { toAdminRecord } from "@/lib/admin/serialize";
import { notFound } from "next/navigation";

async function getData(id: string) {
  await connectDB();
  const item = await EmailCampaign.findById(id).lean();
  if (!item) return null;
  return toAdminRecord(item);
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getData(id);
  if (!data) notFound();

  return <EmailCampaignForm initialData={data} isNew={false} />;
}
