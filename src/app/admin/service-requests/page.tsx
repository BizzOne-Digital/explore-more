import Link from "next/link";
import connectDB from "@/lib/db";
import { ServiceRequest, Program } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { GradeHub } from "@/components/admin/GradeHub";
import { GradeBreadcrumb } from "@/components/admin/GradeBreadcrumb";
import { ServiceRequestStatusSelect } from "@/components/admin/ServiceRequestStatusSelect";
import { serialize, formatDate } from "@/lib/admin/serialize";
import { formatGradeLabel, gradeFilterForLevel, isGradeLevel } from "@/lib/grades";
import type { GradeLevel } from "@/lib/grades";

async function getDataByGrade(grade: GradeLevel) {
  await connectDB();
  const programIds = await Program.find(gradeFilterForLevel(grade)).select("_id").lean();
  const ids = programIds.map((p) => p._id);
  const items = await ServiceRequest.find({ programId: { $in: ids } })
    .populate("programId", "title grade")
    .sort({ createdAt: -1 })
    .lean();
  return serialize(items);
}

async function getAllData() {
  await connectDB();
  const items = await ServiceRequest.find()
    .populate("programId", "title grade")
    .sort({ createdAt: -1 })
    .lean();
  return serialize(items);
}

async function getPendingData() {
  await connectDB();
  const items = await ServiceRequest.find({ status: "new" })
    .populate("programId", "title grade")
    .sort({ createdAt: -1 })
    .lean();
  return serialize(items);
}

type ServiceRequestRow = Record<string, unknown>;

const requestColumns: Column<ServiceRequestRow>[] = [
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
    key: "programGrade",
    header: "Grade",
    render: (row) => {
      const program = row.programId as { grade?: string } | null;
      return program?.grade ? formatGradeLabel(program.grade) : "—";
    },
  },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <ServiceRequestStatusSelect id={String(row._id)} status={String(row.status)} />
    ),
  },
  {
    key: "createdAt",
    header: "Submitted",
    render: (row) => formatDate(row.createdAt as string),
  },
];

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string }>;
}) {
  const { grade } = await searchParams;

  if (grade === "all") {
    const data = await getAllData();

    return (
      <div>
        <PageHeader
          title="All Service Requests"
          description="Program inquiry requests across all grades"
        >
          <Link
            href="/admin/service-requests"
            className="text-sm text-explore-lime hover:underline"
          >
            Back to grade hub
          </Link>
        </PageHeader>
        <DataTable
          columns={requestColumns}
          data={data as unknown as ServiceRequestRow[]}
          emptyMessage="No service requests found."
        />
      </div>
    );
  }

  if (!grade || !isGradeLevel(grade)) {
    const pending = await getPendingData();

    return (
      <div>
        <PageHeader
          title="Service Requests"
          description="Program inquiry requests from the public website"
        >
          <Link
            href="/admin/service-requests?grade=all"
            className="text-sm font-medium text-explore-lime hover:underline"
          >
            View all requests
          </Link>
        </PageHeader>

        {pending.length > 0 && (
          <section className="mb-8">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="font-display text-lg font-semibold text-white">
                Pending inquiries
              </h2>
              <StatusBadge status="new" />
            </div>
            <p className="mb-4 text-sm text-white/50">
              These are new program booking inquiries — not parent portal messages. Mark as
              contacted or completed to clear them from the dashboard count.
            </p>
            <DataTable
              columns={requestColumns}
              data={pending as unknown as ServiceRequestRow[]}
              emptyMessage="No pending inquiries."
            />
          </section>
        )}

        <GradeHub
          title="Browse by grade"
          description="Program inquiry requests organized by grade level"
          basePath="/admin/service-requests"
        />
      </div>
    );
  }

  const data = await getDataByGrade(grade);

  return (
    <div>
      <GradeBreadcrumb basePath="/admin/service-requests" grade={grade} />
      <PageHeader
        title={`${formatGradeLabel(grade)} Service Requests`}
        description="Program inquiry requests for this grade"
      />
      <DataTable
        columns={requestColumns}
        data={data as unknown as ServiceRequestRow[]}
        emptyMessage="No service requests found for this grade."
      />
    </div>
  );
}
