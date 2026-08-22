import type { ComponentProps } from "react";
import { CertificateForm } from "@/components/admin/forms/CertificateForm";
import { serializeAdmin } from "@/lib/admin/serialize";
import { getCertificateAssociationOptions } from "@/lib/certificates/association-options";
import { getStudentsForGrade } from "@/lib/grades/queries";
import { isGradeLevel, type GradeLevel } from "@/lib/grades";
import { redirect } from "next/navigation";

type CertificateFormProps = ComponentProps<typeof CertificateForm>;

async function getData(grade: GradeLevel) {
  const [students, associations] = await Promise.all([
    getStudentsForGrade(grade),
    getCertificateAssociationOptions(grade),
  ]);

  return {
    students: serializeAdmin(students) as unknown as CertificateFormProps["students"],
    ...associations,
    grade,
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string }>;
}) {
  const { grade } = await searchParams;
  if (!grade || !isGradeLevel(grade)) {
    redirect("/admin/certificates");
  }

  const data = await getData(grade);
  return <CertificateForm isNew {...data} />;
}
