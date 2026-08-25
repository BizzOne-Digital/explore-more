import type { ComponentProps } from "react";
import connectDB from "@/lib/db";
import { EventRegistration, Event } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { EventRegistrationsTable } from "@/components/admin/EventRegistrationsTable";
import { GradeHub } from "@/components/admin/GradeHub";
import { GradeBreadcrumb } from "@/components/admin/GradeBreadcrumb";
import { EventsGradeList } from "@/components/admin/EventsGradeList";
import { serializeAdmin } from "@/lib/admin/serialize";
import { formatGradeLabel, gradeFilterForLevel, isGradeLevel } from "@/lib/grades";
import type { GradeLevel } from "@/lib/grades";

async function getEventsForGrade(grade: string) {
  await connectDB();
  const events = await Event.find(gradeFilterForLevel(grade as GradeLevel)).sort({ startDate: -1 }).lean();
  const counts = await EventRegistration.aggregate([
    { $match: { eventId: { $in: events.map((e) => e._id) } } },
    { $group: { _id: "$eventId", count: { $sum: 1 } } },
  ]);
  const countMap = new Map(counts.map((c) => [c._id.toString(), c.count as number]));

  return events.map((event) => ({
    _id: event._id.toString(),
    title: event.title,
    startDate: event.startDate ? event.startDate.toISOString() : undefined,
    status: event.status,
    registrationCount: countMap.get(event._id.toString()) ?? 0,
  }));
}

async function getRegistrationsForEvent(eventId: string) {
  await connectDB();
  const [registrations, event] = await Promise.all([
    EventRegistration.find({ eventId })
      .populate("eventId", "title startDate")
      .sort({ createdAt: -1 })
      .lean(),
    Event.findById(eventId).select("title grade").lean(),
  ]);

  return {
    registrations: serializeAdmin(registrations),
    event: event ? serializeAdmin(event) : null,
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string; event?: string; search?: string }>;
}) {
  const { grade, event, search } = await searchParams;

  if (!grade || !isGradeLevel(grade)) {
    return (
      <GradeHub
        title="Event Registrations"
        description="View and manage registrations by grade"
        basePath="/admin/event-registrations"
      />
    );
  }

  if (!event) {
    const events = await getEventsForGrade(grade);
    return (
      <div>
        <GradeBreadcrumb basePath="/admin/event-registrations" grade={grade} />
        <PageHeader
          title={`${formatGradeLabel(grade)} Event Registrations`}
          description="Select an event to view its registrations"
        />
        <EventsGradeList
          events={events}
          grade={grade}
          basePath="/admin/event-registrations"
        />
      </div>
    );
  }

  const { registrations, event: eventDoc } = await getRegistrationsForEvent(event);
  const eventTitle = (eventDoc as { title?: string } | null)?.title ?? "Event";

  return (
    <div>
      <GradeBreadcrumb
        basePath="/admin/event-registrations"
        grade={grade}
        segments={[{ label: eventTitle }]}
      />
      <PageHeader
        title={`${eventTitle} — Registrations`}
        description={`Registrations for ${formatGradeLabel(grade)}`}
        action={{
          label: "New Registration",
          href: `/admin/event-registrations/new?grade=${encodeURIComponent(grade)}&event=${encodeURIComponent(event)}`,
        }}
      />
      <EventRegistrationsTable
        registrations={
          serializeAdmin(registrations) as unknown as ComponentProps<
            typeof EventRegistrationsTable
          >["registrations"]
        }
        events={[{ _id: event, title: eventTitle }]}
        initialEventFilter={event}
        initialSearch={search}
      />
    </div>
  );
}
