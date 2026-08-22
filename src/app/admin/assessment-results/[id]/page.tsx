import connectDB from "@/lib/db";
import { Assessment } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { GradeBreadcrumb } from "@/components/admin/GradeBreadcrumb";
import { AssessmentGradingTable } from "@/components/admin/AssessmentGradingTable";
import { getAssessmentTrackerRows } from "@/lib/assessments/queries";
import { formatGradeLabel, isGradeLevel, type GradeLevel } from "@/lib/grades";
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
    redirect("/admin/assessment-results");
  }

  await connectDB();
  const assessment = await Assessment.findById(id).lean();
  if (!assessment || assessment.grade !== grade) notFound();

  const rows = await getAssessmentTrackerRows(id, grade as GradeLevel);

  return (
    <div>
      <GradeBreadcrumb
        basePath="/admin/assessment-results"
        grade={grade}
        segments={[{ label: assessment.title }]}
      />
      <PageHeader
        title={`Results — ${assessment.title}`}
        description={`Grade resubmissions and publish to parents (${formatGradeLabel(grade)})`}
      />
      <AssessmentGradingTable rows={rows} />
    </div>
  );
}
