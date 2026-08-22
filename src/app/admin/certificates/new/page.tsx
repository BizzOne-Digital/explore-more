import type { ComponentProps } from "react";
import connectDB from "@/lib/db";
import { User } from "@/models";
import { CertificateForm } from "@/components/admin/forms/CertificateForm";
import { serializeAdmin } from "@/lib/admin/serialize";
import { getCertificateAssociationOptions } from "@/lib/certificates/association-options";

type CertificateFormProps = ComponentProps<typeof CertificateForm>;

async function getData() {
  await connectDB();
  const [students, associations] = await Promise.all([
    User.find({ role: "student" }, "name studentId").sort({ name: 1 }).lean(),
    getCertificateAssociationOptions(),
  ]);

  return {
    students: serializeAdmin(students) as unknown as CertificateFormProps["students"],
    ...associations,
  };
}

export default async function Page() {
  const data = await getData();
  return <CertificateForm isNew {...data} />;
}
