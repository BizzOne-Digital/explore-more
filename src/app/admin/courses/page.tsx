import connectDB from "@/lib/db";
import { Course } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { CoursesTable, type CourseRow } from "@/components/admin/CoursesTable";
import { GradeHub } from "@/components/admin/GradeHub";
import { GradeBreadcrumb } from "@/components/admin/GradeBreadcrumb";
import { serialize } from "@/lib/admin/serialize";
import { formatGradeLabel, gradeFilterForLevel, isGradeLevel, type GradeLevel } from "@/lib/grades";

async function getData(grade: GradeLevel) {
  await connectDB();
  const items = await Course.find(gradeFilterForLevel(grade))
    .sort({ createdAt: -1 })
    .lean();
  return serialize(items);
}

function mapCourseRows(raw: Array<Record<string, unknown>>): CourseRow[] {
  return raw.map((item) => ({
    _id: String(item._id),
    title: item.title as string | undefined,
    instructor: item.instructor as string | undefined,
    courseType: item.courseType as string | undefined,
    priceAmount: item.priceAmount as number | undefined,
    status: item.status as string | undefined,
    publishedToWebsite: item.publishedToWebsite as boolean | undefined,
    enrollmentStatus: item.enrollmentStatus as string | undefined,
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
        title="Courses"
        description="Manage courses and curriculum by grade"
        basePath="/admin/courses"
        newAction={{ label: "Add New Course", href: "/admin/courses/new" }}
      />
    );
  }

  let data: CourseRow[] = [];
  let loadError: string | null = null;

  try {
    data = mapCourseRows((await getData(grade)) as unknown as Array<Record<string, unknown>>);
  } catch (error) {
    console.error("[admin/courses]", error);
    loadError = "Could not load courses. Check database connection and try again.";
  }

  return (
    <div>
      <GradeBreadcrumb basePath="/admin/courses" grade={grade} />
      <PageHeader
        title={`${formatGradeLabel(grade)} Courses`}
        description="Manage courses for this grade"
        action={{
          label: "New Course",
          href: `/admin/courses/new?grade=${encodeURIComponent(grade)}`,
        }}
      />
      {loadError ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {loadError}
        </div>
      ) : (
        <CoursesTable data={data} />
      )}
    </div>
  );
}
