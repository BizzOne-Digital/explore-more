import { EventForm } from "@/components/admin/forms/EventForm";
import { ALL_GRADES_VALUE, isGradeOrAll } from "@/lib/grades";
import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string }>;
}) {
  const { grade } = await searchParams;

  if (grade && !isGradeOrAll(grade)) {
    redirect("/admin/events");
  }

  const defaultGrade = !grade || grade === ALL_GRADES_VALUE ? ALL_GRADES_VALUE : grade;

  return <EventForm isNew defaultGrade={defaultGrade} />;
}
