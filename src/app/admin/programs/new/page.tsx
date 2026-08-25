import { ProgramForm } from "@/components/admin/forms/ProgramForm";
import { ALL_GRADES_VALUE, isGradeOrAll } from "@/lib/grades";
import { redirect } from "next/navigation";

export default async function NewProgramPage({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string }>;
}) {
  const { grade } = await searchParams;

  if (grade && !isGradeOrAll(grade)) {
    redirect("/admin/programs");
  }

  const defaultGrade = !grade || grade === ALL_GRADES_VALUE ? ALL_GRADES_VALUE : grade;

  return <ProgramForm isNew defaultGrade={defaultGrade} />;
}
