import { CourseForm } from "@/components/admin/forms/CourseForm";
import { isGradeLevel } from "@/lib/grades";
import { redirect } from "next/navigation";

export default async function NewCoursePage({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string }>;
}) {
  const { grade } = await searchParams;
  if (!grade || !isGradeLevel(grade)) {
    redirect("/admin/courses");
  }
  return <CourseForm isNew defaultGrade={grade} />;
}
