import connectDB from "@/lib/db";
import { Enrollment, Course } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { GradeHub } from "@/components/admin/GradeHub";
import { GradeBreadcrumb } from "@/components/admin/GradeBreadcrumb";
import { serialize, formatDate } from "@/lib/admin/serialize";
import { formatGradeLabel, gradeFilterForLevel, isGradeLevel } from "@/lib/grades";
import type { GradeLevel } from "@/lib/grades";

async function getData(grade: string) {
  await connectDB();
  const courseIds = await Course.find(gradeFilterForLevel(grade as GradeLevel)).select("_id").lean();
  const ids = courseIds.map((c) => c._id);
  const items = await Enrollment.find({ courseId: { $in: ids } })
    .populate("courseId", "title grade")
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
        title="Enrollments"
        description="View course enrollments by grade"
        basePath="/admin/enrollments"
      />
    );
  }

  const data = await getData(grade);

  return (
    <div>
      <GradeBreadcrumb basePath="/admin/enrollments" grade={grade} />
      <PageHeader
        title={`${formatGradeLabel(grade)} Enrollments`}
        description="Course enrollments for this grade"
      />
      <DataTable
        columns={[
          {
            key: "courseId",
            header: "Course",
            render: (row) => {
              const course = row.courseId as { title?: string } | null;
              return course?.title ?? "—";
            },
          },
          { key: "userId", header: "User ID" },
          {
            key: "progress",
            header: "Progress",
            render: (row) => String(row.progress) + "%",
          },
          {
            key: "status",
            header: "Status",
            render: (row) => <StatusBadge status={String(row.status)} />,
          },
          {
            key: "enrolledAt",
            header: "Enrolled",
            render: (row) => formatDate(row.enrolledAt),
          },
        ]}
        data={data}
        emptyMessage="No enrollments found for this grade."
      />
    </div>
  );
}
