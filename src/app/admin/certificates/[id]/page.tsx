import type { ComponentProps } from "react";
import connectDB from "@/lib/db";
import { Certificate, User } from "@/models";
import { CertificateForm } from "@/components/admin/forms/CertificateForm";
import { serializeAdmin, toAdminRecord } from "@/lib/admin/serialize";
import { getCertificateAssociationOptions } from "@/lib/certificates/association-options";
import { notFound } from "next/navigation";

type CertificateFormProps = ComponentProps<typeof CertificateForm>;

async function getData(id: string) {
  await connectDB();

  const [certificate, students, associations] = await Promise.all([
    Certificate.findById(id).lean(),
    User.find({ role: "student" }, "name studentId").sort({ name: 1 }).lean(),
    getCertificateAssociationOptions(),
  ]);

  if (!certificate) return null;

  return {
    certificate: toAdminRecord(certificate),
    students: serializeAdmin(students) as unknown as CertificateFormProps["students"],
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
    />
  );
}
