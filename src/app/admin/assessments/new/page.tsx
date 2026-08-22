import { AssessmentForm } from "@/components/admin/forms/AssessmentForm";
import { isGradeLevel } from "@/lib/grades";
import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string }>;
}) {
  const { grade } = await searchParams;
  if (!grade || !isGradeLevel(grade)) {
    redirect("/admin/assessments");
  }

  return <AssessmentForm grade={grade} />;
}
