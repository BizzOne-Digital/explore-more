import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import connectDB from "@/lib/db";
import { PortfolioWorkSample } from "@/models";
import { resolveParentContext } from "@/lib/parent/context";
import { PortfolioSubNav } from "@/components/parent/ParentNav";
import { StudentYearSelector } from "@/components/parent/StudentYearSelector";
import { WorkSampleForm } from "@/components/parent/PortfolioForms";
import { PROGRESS_MARKER_LABELS } from "@/lib/portfolio/constants";

export default async function WorkSamplesPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; year?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/parent/login?callbackUrl=/parent/portfolio/work-samples");

  const params = await searchParams;
  const ctx = await resolveParentContext(session.user.id, params);
  if (!ctx.studentId || !ctx.portfolio) redirect("/parent/portfolio");

  await connectDB();
  const samples = await PortfolioWorkSample.find({ portfolioId: ctx.portfolio._id }).sort({ dateCompleted: -1 });

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">Work Samples</h2>
      <Suspense fallback={null}>
        <StudentYearSelector
          students={ctx.students.map((s) => ({ id: s.id, name: s.name }))}
          selectedStudentId={ctx.studentId}
          selectedYear={ctx.schoolYear}
        />
        <PortfolioSubNav />
      </Suspense>

      <WorkSampleForm studentId={ctx.studentId} schoolYear={ctx.schoolYear} />

      <div className="space-y-3">
        {samples.map((sample) => (
          <article key={sample._id.toString()} className="rounded-xl bg-white p-5 shadow-sm border border-explore-charcoal/8">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase text-explore-teal">{sample.subject}</p>
                <h3 className="font-semibold text-explore-charcoal">{sample.assignmentName}</h3>
                <p className="text-sm text-explore-charcoal/60">
                  {new Date(sample.dateCompleted).toLocaleDateString()}
                  {sample.progressMarker !== "none" && ` · ${PROGRESS_MARKER_LABELS[sample.progressMarker]}`}
                </p>
              </div>
            </div>
            {sample.description && <p className="mt-2 text-sm text-explore-charcoal/70">{sample.description}</p>}
            {sample.reviewerComment && (
              <p className="mt-2 rounded-lg bg-explore-orange/10 p-3 text-sm text-explore-charcoal">
                Reviewer: {sample.reviewerComment}
              </p>
            )}
            {sample.files.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {sample.files.map((file) => (
                  <li key={file.path}>
                    <a
                      href={`/api/files/private/${file.path}`}
                      className="rounded-lg bg-explore-sand px-3 py-1 text-xs font-semibold text-explore-teal hover:underline"
                    >
                      Download {file.originalName}
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}
