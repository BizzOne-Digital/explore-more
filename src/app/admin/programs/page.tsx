import connectDB from "@/lib/db";
import { Program } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { GradeHub } from "@/components/admin/GradeHub";
import { GradeBreadcrumb } from "@/components/admin/GradeBreadcrumb";
import { serialize } from "@/lib/admin/serialize";
import { formatGradeLabel, isGradeLevel } from "@/lib/grades";

async function getData(grade: string) {
  await connectDB();
  const items = await Program.find({ grade }).sort({ listingOrder: 1 }).lean();
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
      <DataTable
        columns={[
          { key: "title", header: "Title" },
          { key: "tagline", header: "Tagline" },
          { key: "grade", header: "Grade", render: (row) => formatGradeLabel(String(row.grade ?? "")) },
          { key: "status", header: "Status", render: (row) => <StatusBadge status={String(row.status)} /> },
        ]}
        data={data}
        rowHref={(row) => "/admin/programs/" + String(row._id)}
        emptyMessage="No programs found for this grade."
      />
    </div>
  );
}
