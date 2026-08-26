import connectDB from "@/lib/db";
import { Program } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { ProgramsTable, type ProgramRow } from "@/components/admin/ProgramsTable";
import { GradeHub } from "@/components/admin/GradeHub";
import { GradeBreadcrumb } from "@/components/admin/GradeBreadcrumb";
import { serialize } from "@/lib/admin/serialize";
import { formatGradeLabel, gradeFilterForLevel, isGradeLevel, type GradeLevel } from "@/lib/grades";

async function getData(grade: GradeLevel) {
  await connectDB();
  const items = await Program.find(gradeFilterForLevel(grade))
    .sort({ listingOrder: 1 })
    .lean();
  return serialize(items);
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
        title="Programs"
        description="Manage adventure programs by grade"
        basePath="/admin/programs"
        newAction={{ label: "Add New Program", href: "/admin/programs/new" }}
      />
    );
  }

  const data = await getData(grade);

  return (
    <div>
      <GradeBreadcrumb basePath="/admin/programs" grade={grade} />
      <PageHeader
        title={`${formatGradeLabel(grade)} Programs`}
        description="Manage programs for this grade"
        action={{
          label: "New Program",
          href: `/admin/programs/new?grade=${encodeURIComponent(grade)}`,
        }}
      />
      <ProgramsTable data={data as unknown as ProgramRow[]} />
    </div>
  );
}
