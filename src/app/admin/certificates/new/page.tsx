import type { ComponentProps } from "react";
import connectDB from "@/lib/db";
import { User } from "@/models";
import { CertificateForm } from "@/components/admin/forms/CertificateForm";
import { serializeAdmin } from "@/lib/admin/serialize";

type CertificateFormProps = ComponentProps<typeof CertificateForm>;

async function getData() {
  await connectDB();
  const students = await User.find({ role: "student" }, "name studentId").sort({ name: 1 }).lean();
  return {
    students: serializeAdmin(students) as unknown as CertificateFormProps["students"],
  };
}

export default async function Page() {
  const data = await getData();
  return <CertificateForm isNew {...data} />;
}
