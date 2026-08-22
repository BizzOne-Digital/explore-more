import { EventForm } from "@/components/admin/forms/EventForm";
import { isGradeLevel } from "@/lib/grades";
import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string }>;
}) {
  const { grade } = await searchParams;
  if (!grade || !isGradeLevel(grade)) {
    redirect("/admin/events");
  }
  return <EventForm isNew defaultGrade={grade} />;
}
