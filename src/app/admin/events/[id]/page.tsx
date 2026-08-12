import connectDB from "@/lib/db";
import { Event } from "@/models";
import { EventForm } from "@/components/admin/forms/EventForm";
import { toAdminRecord } from "@/lib/admin/serialize";
import { notFound } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await connectDB();
  const item = await Event.findById(id).lean();
  if (!item) notFound();
  return <EventForm initialData={toAdminRecord(item)} />;
}
