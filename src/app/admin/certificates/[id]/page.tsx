import type { ComponentProps } from "react";
import connectDB from "@/lib/db";
import { Certificate, User } from "@/models";
import { CertificateForm } from "@/components/admin/forms/CertificateForm";
import { serializeAdmin, toAdminRecord } from "@/lib/admin/serialize";
import { getCertificateAssociationOptions } from "@/lib/certificates/association-options";
import { getStudentsForGrade } from "@/lib/grades/queries";
import { isGradeLevel, type GradeLevel } from "@/lib/grades";
import { notFound } from "next/navigation";

type CertificateFormProps = ComponentProps<typeof CertificateForm>;

async function getData(id: string) {
  await connectDB();

  const certificate = await Certificate.findById(id).lean();
  if (!certificate) return null;

  const grade = certificate.grade as GradeLevel | undefined;
  const [students, associations] = await Promise.all([
    grade ? getStudentsForGrade(grade) : User.find({ role: "student" }, "name studentId").sort({ name: 1 }).lean(),
    getCertificateAssociationOptions(grade),
  ]);

  return {
    certificate: toAdminRecord(certificate),
    students: serializeAdmin(students) as unknown as CertificateFormProps["students"],
    grade,
    ...associations,
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getData(id);
  if (!data) notFound();

  return (
    <CertificateForm
      initialData={data.certificate}
      students={data.students}
      courses={data.courses}
      programs={data.programs}
      events={data.events}
      grade={data.grade && isGradeLevel(data.grade) ? data.grade : undefined}
    />
  );
}
