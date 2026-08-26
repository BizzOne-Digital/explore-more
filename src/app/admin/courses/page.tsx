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

  const data = await getData(grade);

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
      <CoursesTable data={data as unknown as CourseRow[]} />
    </div>
  );
}
