import type { ComponentProps } from "react";
import connectDB from "@/lib/db";
import { Certificate, User } from "@/models";
import { CertificateForm } from "@/components/admin/forms/CertificateForm";
import { serializeAdmin, toAdminRecord } from "@/lib/admin/serialize";
import { notFound } from "next/navigation";

type CertificateFormProps = ComponentProps<typeof CertificateForm>;

async function getData(id: string) {
  await connectDB();

  const certificate = await Certificate.findById(id).lean();
  if (!certificate) return null;

  const students = await User.find({ role: "student" }, "name studentId").sort({ name: 1 }).lean();

  return {
    certificate: toAdminRecord(certificate),
    students: serializeAdmin(students) as unknown as CertificateFormProps["students"],
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
    />
  );
}
