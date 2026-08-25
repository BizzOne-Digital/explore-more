import connectDB from "@/lib/db";
import { Event } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { EventsTable, type EventRow } from "@/components/admin/EventsTable";
import { GradeHub } from "@/components/admin/GradeHub";
import { GradeBreadcrumb } from "@/components/admin/GradeBreadcrumb";
import { serialize } from "@/lib/admin/serialize";
import { formatGradeLabel, gradeFilterForLevel, isGradeLevel, type GradeLevel } from "@/lib/grades";

async function getData(grade: GradeLevel) {
  await connectDB();
  const items = await Event.find(gradeFilterForLevel(grade))
    .sort({ createdAt: -1 })
    .lean();
  return serialize(items);
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string }>;
}) {
  const { grade } = await searchParams;

  if (!grade || !isGradeLevel(grade)) {
    return (
      <GradeHub
        title="Events"
        description="Manage events and workshops by grade"
        basePath="/admin/events"
        newAction={{ label: "Add New Event", href: "/admin/events/new" }}
      />
    );
  }

  const raw = await getData(grade);
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
      <GradeBreadcrumb basePath="/admin/events" grade={grade} />
      <PageHeader
        title={`${formatGradeLabel(grade)} Events`}
        description="Manage events and workshops for this grade"
        action={{
          label: "New Event",
          href: `/admin/events/new?grade=${encodeURIComponent(grade)}`,
        }}
      />
      <EventsTable data={data} />
    </div>
  );
}
