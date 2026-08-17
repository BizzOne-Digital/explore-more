import type { ComponentProps } from "react";
import connectDB from "@/lib/db";
import { EventRegistration, Event } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { EventRegistrationsTable } from "@/components/admin/EventRegistrationsTable";
import { serializeAdmin } from "@/lib/admin/serialize";

async function getData() {
  await connectDB();
  const registrations = await EventRegistration.find()
    .populate("eventId", "title startDate")
    .sort({ createdAt: -1 })
    .lean();
  
  const events = await Event.find({}, "title _id").sort({ title: 1 }).lean();
  
  return {
    registrations: serializeAdmin(registrations),
    events: serializeAdmin(events),
  };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ event?: string; search?: string }> }) {
  const { event, search } = await searchParams;
  const { registrations, events } = await getData();

  return (
    <div>
      <PageHeader
        title="Event Registrations"
        description="View and manage event registrations"
        action={{ label: "New Registration", href: "/admin/event-registrations/new" }}
      />
      <EventRegistrationsTable
        registrations={serializeAdmin(registrations) as unknown as ComponentProps<typeof EventRegistrationsTable>["registrations"]}
        events={serializeAdmin(events) as unknown as ComponentProps<typeof EventRegistrationsTable>["events"]}
        initialEventFilter={event}
        initialSearch={search}
      />
    </div>
  );
}
