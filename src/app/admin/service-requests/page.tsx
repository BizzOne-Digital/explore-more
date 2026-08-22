import connectDB from "@/lib/db";
import { ServiceRequest, Program } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { GradeHub } from "@/components/admin/GradeHub";
import { GradeBreadcrumb } from "@/components/admin/GradeBreadcrumb";
import { serialize, formatDate } from "@/lib/admin/serialize";
import { formatGradeLabel, isGradeLevel } from "@/lib/grades";

async function getData(grade: string) {
  await connectDB();
  const programIds = await Program.find({ grade }).select("_id").lean();
  const ids = programIds.map((p) => p._id);
  const items = await ServiceRequest.find({ programId: { $in: ids } })
    .populate("programId", "title grade")
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
        title="Service Requests"
        description="Program inquiry requests by grade"
        basePath="/admin/service-requests"
      />
    );
  }

  const data = await getData(grade);

  return (
    <div>
      <GradeBreadcrumb basePath="/admin/service-requests" grade={grade} />
      <PageHeader
        title={`${formatGradeLabel(grade)} Service Requests`}
        description="Program inquiry requests for this grade"
      />
      <DataTable
        columns={[
          { key: "studentName", header: "Student" },
          { key: "parentName", header: "Parent" },
          { key: "email", header: "Email" },
          {
            key: "programId",
            header: "Program",
            render: (row) => {
              const program = row.programId as { title?: string } | null;
              return program?.title ?? "—";
            },
          },
          {
            key: "status",
            header: "Status",
            render: (row) => <StatusBadge status={String(row.status)} />,
          },
          {
            key: "createdAt",
            header: "Submitted",
            render: (row) => formatDate(row.createdAt),
          },
        ]}
        data={data}
        emptyMessage="No service requests found for this grade."
      />
    </div>
  );
}
