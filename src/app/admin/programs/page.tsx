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

function mapProgramRows(raw: Array<Record<string, unknown>>): ProgramRow[] {
  return raw.map((item) => ({
    _id: String(item._id),
    title: item.title as string | undefined,
    tagline: item.tagline as string | undefined,
    grade: item.grade as string | undefined,
    status: item.status as string | undefined,
  }));
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

  let data: ProgramRow[] = [];
  let loadError: string | null = null;

  try {
    data = mapProgramRows((await getData(grade)) as unknown as Array<Record<string, unknown>>);
  } catch (error) {
    console.error("[admin/programs]", error);
    loadError = "Could not load programs. Check database connection and try again.";
  }

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
      {loadError ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {loadError}
        </div>
      ) : (
        <ProgramsTable data={data} />
      )}
    </div>
  );
}
