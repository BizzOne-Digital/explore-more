import type { ComponentProps } from "react";
import connectDB from "@/lib/db";
import { EventRegistration, Event } from "@/models";
import { EventRegistrationForm } from "@/components/admin/forms/EventRegistrationForm";
import { toAdminRecord, serializeAdmin } from "@/lib/admin/serialize";
import { notFound } from "next/navigation";

async function getData(id: string) {
  await connectDB();
  const registration = await EventRegistration.findById(id).lean();
  if (!registration) return null;
  
  const events = await Event.find({ status: { $in: ["draft", "published"] } })
    .sort({ startDate: 1 })
    .lean();
  
  return {
    registration: toAdminRecord(registration),
    events: serializeAdmin(events),
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getData(id);
  if (!data) notFound();
  
  return (
    <EventRegistrationForm
      initialData={data.registration}
      events={serializeAdmin(data.events) as unknown as ComponentProps<typeof EventRegistrationForm>["events"]}
    />
  );
}
