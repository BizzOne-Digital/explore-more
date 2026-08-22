import connectDB from "@/lib/db";
import { Assessment } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { GradeBreadcrumb } from "@/components/admin/GradeBreadcrumb";
import { AssessmentTrackerTable } from "@/components/admin/AssessmentTrackerTable";
import { getAssessmentTrackerRows } from "@/lib/assessments/queries";
import { formatGradeLabel, isGradeLevel, type GradeLevel } from "@/lib/grades";
import { getAssessmentFileUrl } from "@/lib/assessments/display";
import { notFound, redirect } from "next/navigation";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ grade?: string }>;
}) {
  const { id } = await params;
  const { grade } = await searchParams;

  if (!grade || !isGradeLevel(grade)) {
    redirect("/admin/assessments");
  }

  await connectDB();
  const assessment = await Assessment.findById(id).lean();
  if (!assessment || assessment.grade !== grade) notFound();

  const rows = await getAssessmentTrackerRows(id, grade as GradeLevel);

  return (
    <div>
      <GradeBreadcrumb
        basePath="/admin/assessments"
        grade={grade}
        segments={[{ label: assessment.title }]}
      />
      <PageHeader
        title={assessment.title}
        description={`Parent resubmission tracker — ${formatGradeLabel(grade)}`}
      />

      <div className="mb-6 rounded-xl border border-white/10 bg-white/5 p-4">
        <p className="text-sm text-white/60">Original assessment PDF</p>
        <a
          href={getAssessmentFileUrl(assessment.filePath)}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-block text-sm text-explore-teal hover:underline"
        >
          Download original PDF
        </a>
      </div>

      <AssessmentTrackerTable rows={rows} />
    </div>
  );
}
