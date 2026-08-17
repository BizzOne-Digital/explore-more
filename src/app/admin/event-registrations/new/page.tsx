import type { ComponentProps } from "react";
import connectDB from "@/lib/db";
import { Event } from "@/models";
import { EventRegistrationForm } from "@/components/admin/forms/EventRegistrationForm";
import { serializeAdmin } from "@/lib/admin/serialize";

async function getEvents() {
  await connectDB();
  const events = await Event.find({ status: { $in: ["draft", "published"] } })
    .sort({ startDate: 1 })
    .lean();
  return serializeAdmin(events);
}

export default async function Page() {
  const events = await getEvents();
  return <EventRegistrationForm isNew events={serializeAdmin(events) as unknown as ComponentProps<typeof EventRegistrationForm>["events"]} />;
}
