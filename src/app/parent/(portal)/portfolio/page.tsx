import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { resolveParentContext } from "@/lib/parent/context";
import { PortfolioSubNav } from "@/components/parent/ParentNav";
import { StudentYearSelector } from "@/components/parent/StudentYearSelector";
import {
  PortfolioProgressCard,
  SubjectProgressGrid,
  QuickActionButtons,
} from "@/components/parent/PortfolioCards";
import { SubmitPortfolioButton } from "@/components/parent/PortfolioForms";

export default async function PortfolioOverviewPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; year?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/parent/login?callbackUrl=/parent/portfolio");

  const params = await searchParams;
  const ctx = await resolveParentContext(session.user.id, params);

  if (!ctx.studentId || !ctx.portfolio || !ctx.stats || !ctx.readiness) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
        <p className="text-explore-charcoal/60">Link a student to start your homeschool portfolio.</p>
      </div>
    );
  }

  const studentName = ctx.students.find((s) => s.id === ctx.studentId)?.name ?? "Student";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">My Homeschool Portfolio</h2>
        <p className="mt-1 text-sm text-explore-charcoal/70">
          Document instruction, progress, curriculum, and activities for portfolio review.
        </p>
      </div>

      <Suspense fallback={null}>
        <StudentYearSelector
          students={ctx.students.map((s) => ({ id: s.id, name: s.name }))}
          selectedStudentId={ctx.studentId}
          selectedYear={ctx.schoolYear}
        />
        <PortfolioSubNav />
      </Suspense>

      <PortfolioProgressCard
        studentName={studentName}
        schoolYear={ctx.schoolYear}
        status={ctx.portfolio.status}
        stats={ctx.stats}
        readiness={ctx.readiness}
      />

      <QuickActionButtons studentId={ctx.studentId} year={ctx.schoolYear} />

      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="font-display text-lg font-bold mb-4">Evidence by Subject</h3>
        <SubjectProgressGrid subjectCounts={ctx.stats.subjectCounts} />
      </section>

      <SubmitPortfolioButton
        portfolioId={ctx.portfolio._id.toString()}
        canSubmit={ctx.canSubmit}
      />
    </div>
  );
}
