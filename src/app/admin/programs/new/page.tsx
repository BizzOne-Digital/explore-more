import { ProgramForm } from "@/components/admin/forms/ProgramForm";
import { isGradeLevel } from "@/lib/grades";
import { redirect } from "next/navigation";

export default async function NewProgramPage({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string }>;
}) {
  const { grade } = await searchParams;
  if (!grade || !isGradeLevel(grade)) {
    redirect("/admin/programs");
  }
  return <ProgramForm isNew defaultGrade={grade} />;
}
