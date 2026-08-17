import type { ComponentProps } from "react";
import connectDB from "@/lib/db";
import { Certificate, User } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { CertificatesTable } from "@/components/admin/CertificatesTable";
import { serializeAdmin } from "@/lib/admin/serialize";

async function getData() {
  await connectDB();
  const certificates = await Certificate.find()
    .populate("studentId", "name studentId")
    .sort({ createdAt: -1 })
    .lean();
  
  const students = await User.find({ role: "student" }, "name studentId")
    .sort({ name: 1 })
    .lean();
  
  return {
    certificates: serializeAdmin(certificates),
    students: serializeAdmin(students),
  };
}

export default async function Page() {
  const { certificates, students } = await getData();

  return (
    <div>
      <PageHeader
        title="Certificates"
        description="Issue and manage student certificates"
        action={{ label: "New Certificate", href: "/admin/certificates/new" }}
      />
      <CertificatesTable
        certificates={serializeAdmin(certificates) as unknown as ComponentProps<typeof CertificatesTable>["certificates"]}
        students={serializeAdmin(students) as unknown as ComponentProps<typeof CertificatesTable>["students"]}
      />
    </div>
  );
}
