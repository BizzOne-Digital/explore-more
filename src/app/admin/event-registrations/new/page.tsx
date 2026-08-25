import type { ComponentProps } from "react";
import connectDB from "@/lib/db";
import { Event } from "@/models";
import { EventRegistrationForm } from "@/components/admin/forms/EventRegistrationForm";
import { serializeAdmin } from "@/lib/admin/serialize";
import { isGradeLevel, gradeFilterForLevel, type GradeLevel } from "@/lib/grades";
import { redirect } from "next/navigation";

async function getEvents(grade: GradeLevel) {
  await connectDB();
  const events = await Event.find({
    ...gradeFilterForLevel(grade),
    status: { $in: ["draft", "published"] },
  })
    .sort({ startDate: 1 })
    .lean();
  return serializeAdmin(events);
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string; event?: string }>;
}) {
  const { grade, event } = await searchParams;
  if (!grade || !isGradeLevel(grade)) {
    redirect("/admin/event-registrations");
  }

  const events = await getEvents(grade);
  return (
    <EventRegistrationForm
      isNew
      grade={grade}
      defaultEventId={event}
      events={
        serializeAdmin(events) as unknown as ComponentProps<
          typeof EventRegistrationForm
        >["events"]
      }
    />
  );
}
