import connectDB from "@/lib/db";
import { Event } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { EventsTable, type EventRow } from "@/components/admin/EventsTable";
import { serialize } from "@/lib/admin/serialize";

async function getData() {
  await connectDB();
  const items = await Event.find().sort({ createdAt: -1 }).lean();
  return serialize(items);
}

export default async function Page() {
  const raw = await getData();
  const data: EventRow[] = raw.map((item) => ({
    _id: String(item._id),
    title: item.title,
    startDate: item.startDate ? String(item.startDate) : undefined,
    location: item.location,
    eventType: item.eventType,
    status: item.status,
    publishedToWebsite: item.publishedToWebsite,
  }));

  return (
    <div>
      <PageHeader
        title="Events"
        description="Manage events and workshops"
        action={{ label: "New Event", href: "/admin/events/new" }}
      />
      <EventsTable data={data} />
    </div>
  );
}
