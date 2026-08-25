import { CourseForm } from "@/components/admin/forms/CourseForm";
import { ALL_GRADES_VALUE, isGradeOrAll } from "@/lib/grades";
import { redirect } from "next/navigation";

export default async function NewCoursePage({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string }>;
}) {
  const { grade } = await searchParams;

  if (grade && !isGradeOrAll(grade)) {
    redirect("/admin/courses");
  }

  const defaultGrade = !grade || grade === ALL_GRADES_VALUE ? ALL_GRADES_VALUE : grade;

  return <CourseForm isNew defaultGrade={defaultGrade} />;
}
