import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import connectDB from "@/lib/db";
import { PortfolioWorkSample } from "@/models";
import { resolveParentContext } from "@/lib/parent/context";
import { PortfolioSubNav } from "@/components/parent/ParentNav";
import { StudentYearSelector } from "@/components/parent/StudentYearSelector";
import { PROGRESS_MARKER_LABELS } from "@/lib/portfolio/constants";

export default async function ProgressMarkersPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; year?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/parent/login?callbackUrl=/parent/portfolio/progress");

  const params = await searchParams;
  const ctx = await resolveParentContext(session.user.id, params);
  if (!ctx.studentId || !ctx.portfolio) redirect("/parent/portfolio");

  await connectDB();
  const samples = await PortfolioWorkSample.find({
    portfolioId: ctx.portfolio._id,
    progressMarker: { $ne: "none" },
  }).sort({ progressMarker: 1, dateCompleted: 1 });

  const beginning = samples.filter((s) => s.progressMarker === "beginning_of_year");
  const end = samples.filter((s) => s.progressMarker === "end_of_year");

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">Progress Markers</h2>
      <p className="text-sm text-explore-charcoal/70">
        Compare beginning-of-year and end-of-year work samples for portfolio review.
      </p>
      <Suspense fallback={null}>
        <StudentYearSelector
          students={ctx.students.map((s) => ({ id: s.id, name: s.name }))}
          selectedStudentId={ctx.studentId}
          selectedYear={ctx.schoolYear}
        />
        <PortfolioSubNav />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-2">
        <MarkerColumn title="Beginning of Year" samples={beginning} />
        <MarkerColumn title="End of Year" samples={end} />
      </div>

      {samples.length === 0 && (
        <p className="text-sm text-explore-charcoal/60">
          Mark work samples as Beginning or End of Year when uploading in Work Samples.
        </p>
      )}
    </div>
  );
}

function MarkerColumn({
  title,
  samples,
}: {
  title: string;
  samples: Array<{
    _id: unknown;
    assignmentName: string;
    subject: string;
    dateCompleted: Date;
    progressMarker: string;
    description?: string;
  }>;
}) {
  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm">
      <h3 className="font-display text-lg font-bold text-explore-teal">{title}</h3>
      <ul className="mt-4 space-y-3">
        {samples.map((s) => (
          <li key={String(s._id)} className="rounded-lg bg-explore-cream p-4">
            <p className="font-semibold text-sm">{s.assignmentName}</p>
            <p className="text-xs text-explore-charcoal/60">
              {s.subject} · {new Date(s.dateCompleted).toLocaleDateString()} · {PROGRESS_MARKER_LABELS[s.progressMarker as keyof typeof PROGRESS_MARKER_LABELS]}
            </p>
            {s.description && <p className="mt-1 text-sm text-explore-charcoal/70">{s.description}</p>}
          </li>
        ))}
        {samples.length === 0 && <p className="text-sm text-explore-charcoal/50">No samples yet</p>}
      </ul>
    </div>
  );
}
