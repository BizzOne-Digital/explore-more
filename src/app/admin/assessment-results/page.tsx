import Link from "next/link";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import { Assessment } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { GradeHub } from "@/components/admin/GradeHub";
import { GradeBreadcrumb } from "@/components/admin/GradeBreadcrumb";
import { serializeAdmin, formatDate } from "@/lib/admin/serialize";
import { formatGradeLabel, isGradeLevel } from "@/lib/grades";

async function getAssessments(grade: string) {
  await connectDB();
  return Assessment.find({ grade }).sort({ createdAt: -1 }).lean();
}

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string; assessment?: string }>;
}) {
  const { grade, assessment: assessmentId } = await searchParams;

  if (!grade || !isGradeLevel(grade)) {
    return (
      <GradeHub
        title="Assessment Results"
        description="Review resubmissions, assign grades, and publish to parents"
        basePath="/admin/assessment-results"
      />
    );
  }

  if (assessmentId) {
    redirect(`/admin/assessment-results/${assessmentId}?grade=${encodeURIComponent(grade)}`);
  }

  const items = serializeAdmin(await getAssessments(grade));

  return (
    <div>
      <GradeBreadcrumb basePath="/admin/assessment-results" grade={grade} />
      <PageHeader
        title={`${formatGradeLabel(grade)} Assessment Results`}
        description="Select an assessment to grade and publish results"
      />

      {items.length === 0 ? (
        <p className="text-sm text-white/50">No assessments for this grade yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-white/60">
              <tr>
                <th className="px-4 py-3 font-medium">Assessment</th>
                <th className="px-4 py-3 font-medium">Uploaded</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={String(item._id)} className="border-t border-white/10 hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-white">{String(item.title)}</td>
                  <td className="px-4 py-3 text-white/70">{formatDate(item.createdAt)}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/assessment-results/${item._id}?grade=${encodeURIComponent(grade)}`}
                      className="text-explore-teal hover:underline"
                    >
                      Grade & publish
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
