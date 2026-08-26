import connectDB from "@/lib/db";
import { Program } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DeletableDataTable } from "@/components/admin/DeletableDataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
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
      <DeletableDataTable
        columns={[
          { key: "title", header: "Title" },
          { key: "tagline", header: "Tagline" },
          { key: "grade", header: "Grade", render: (row) => formatGradeLabel(String(row.grade ?? "")) },
          { key: "status", header: "Status", render: (row) => <StatusBadge status={String(row.status)} /> },
        ]}
        data={data as unknown as { _id: string; title?: string; tagline?: string; grade?: string; status?: string }[]}
        rowHref={(row) => "/admin/programs/" + String(row._id)}
        deleteUrl={(row) => `/api/admin/programs/${row._id}`}
        itemLabel={(row) => String(row.title ?? "this program")}
        emptyMessage="No programs found for this grade."
      />
    </div>
  );
}
