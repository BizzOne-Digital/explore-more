import connectDB from "@/lib/db";
import { Course } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
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
      <DataTable
        columns={[
          { key: "title", header: "Title" },
          { key: "instructor", header: "Instructor" },
          {
            key: "priceAmount",
            header: "Price",
            render: (row) =>
              row.courseType === "free" ? "Free" : `$${Number(row.priceAmount).toFixed(2)}`,
          },
          {
            key: "status",
            header: "Status",
            render: (row) => <StatusBadge status={String(row.status)} />,
          },
          {
            key: "publishedToWebsite",
            header: "Website",
            render: (row) =>
              row.publishedToWebsite ? (
                <span className="text-xs text-green-400">✓ Published</span>
              ) : (
                <span className="text-xs text-white/40">Not published</span>
              ),
          },
          {
            key: "enrollmentStatus",
            header: "Enrollment",
            render: (row) => <StatusBadge status={String(row.enrollmentStatus)} />,
          },
        ]}
        data={data}
        rowHref={(row) => "/admin/courses/" + String(row._id)}
        emptyMessage="No courses found for this grade."
      />
    </div>
  );
}
