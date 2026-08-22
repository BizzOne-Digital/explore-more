import Link from "next/link";
import connectDB from "@/lib/db";
import { Assessment } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { GradeHub } from "@/components/admin/GradeHub";
import { GradeBreadcrumb } from "@/components/admin/GradeBreadcrumb";
import { serializeAdmin } from "@/lib/admin/serialize";
import { formatGradeLabel, isGradeLevel } from "@/lib/grades";
import { formatDate } from "@/lib/admin/serialize";
import { getAssessmentFileUrl } from "@/lib/assessments/display";

async function getAssessments(grade: string) {
  await connectDB();
  return Assessment.find({ grade }).sort({ createdAt: -1 }).lean();
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
        title="Assessments"
        description="Upload assessments and track parent resubmissions by grade"
        basePath="/admin/assessments"
      />
    );
  }

  const items = serializeAdmin(await getAssessments(grade));

  return (
    <div>
      <GradeBreadcrumb basePath="/admin/assessments" grade={grade} />
      <PageHeader
        title={`${formatGradeLabel(grade)} Assessments`}
        description="Upload PDF assessments and notify parents in this grade"
        action={{
          label: "Upload Assessment",
          href: `/admin/assessments/new?grade=${encodeURIComponent(grade)}`,
        }}
      />

      {items.length === 0 ? (
        <p className="text-sm text-white/50">No assessments uploaded for this grade yet.</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-white/10">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-white/60">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Uploaded</th>
                <th className="px-4 py-3 font-medium">PDF</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={String(item._id)} className="border-t border-white/10 hover:bg-white/5">
                  <td className="px-4 py-3 font-medium text-white">{String(item.title)}</td>
                  <td className="px-4 py-3 text-white/70">{formatDate(item.createdAt)}</td>
                  <td className="px-4 py-3">
                    <a
                      href={getAssessmentFileUrl(String(item.filePath))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-explore-teal hover:underline"
                    >
                      Download
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/assessments/${item._id}?grade=${encodeURIComponent(grade)}`}
                      className="text-explore-teal hover:underline"
                    >
                      View parents
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
