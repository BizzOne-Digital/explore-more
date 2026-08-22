import type { ComponentProps } from "react";
import connectDB from "@/lib/db";
import { Certificate, User } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { CertificatesTable } from "@/components/admin/CertificatesTable";
import { GradeHub } from "@/components/admin/GradeHub";
import { GradeBreadcrumb } from "@/components/admin/GradeBreadcrumb";
import { serializeAdmin } from "@/lib/admin/serialize";
import { formatGradeLabel, isGradeLevel } from "@/lib/grades";
import { getStudentsForGrade } from "@/lib/grades/queries";

async function getData(grade: string) {
  await connectDB();
  const [certificates, students] = await Promise.all([
    Certificate.find({ grade })
      .populate("studentId", "name studentId")
      .sort({ createdAt: -1 })
      .lean(),
    getStudentsForGrade(grade as Parameters<typeof getStudentsForGrade>[0]),
  ]);

  return {
    certificates: serializeAdmin(certificates),
    students: serializeAdmin(students),
  };
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string }>;
}) {
  const { grade } = await searchParams;

  if (!grade || !isGradeLevel(grade)) {
    return (
      <GradeHub
        title="Certificates"
        description="Issue and manage student certificates by grade"
        basePath="/admin/certificates"
      />
    );
  }

  const { certificates, students } = await getData(grade);

  return (
    <div>
      <GradeBreadcrumb basePath="/admin/certificates" grade={grade} />
      <PageHeader
        title={`${formatGradeLabel(grade)} Certificates`}
        description="Issue and manage certificates for this grade"
        action={{
          label: "New Certificate",
          href: `/admin/certificates/new?grade=${encodeURIComponent(grade)}`,
        }}
      />
      <CertificatesTable
        certificates={
          serializeAdmin(certificates) as unknown as ComponentProps<
            typeof CertificatesTable
          >["certificates"]
        }
        students={
          serializeAdmin(students) as unknown as ComponentProps<typeof CertificatesTable>["students"]
        }
      />
    </div>
  );
}
