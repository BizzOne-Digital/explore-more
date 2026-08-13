import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { resolveParentContext } from "@/lib/parent/context";
import { PortfolioSubNav } from "@/components/parent/ParentNav";
import { StudentYearSelector } from "@/components/parent/StudentYearSelector";
import { ExportPortfolioForm } from "@/components/parent/PortfolioForms";

export default async function ExportPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; year?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/parent/portfolio/export");

  const params = await searchParams;
  const ctx = await resolveParentContext(session.user.id, params);
  if (!ctx.studentId || !ctx.portfolio) redirect("/parent/portfolio");

  const studentName = ctx.students.find((s) => s.id === ctx.studentId)?.name ?? "Student";

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">Download & Export Portfolio</h2>
      <p className="text-sm text-explore-charcoal/70">
        Your records always remain accessible — download individual files from each section or export everything at once.
      </p>
      <Suspense fallback={null}>
        <StudentYearSelector students={ctx.students.map((s) => ({ id: s.id, name: s.name }))} selectedStudentId={ctx.studentId} selectedYear={ctx.schoolYear} />
        <PortfolioSubNav />
      </Suspense>

      <div className="rounded-xl bg-explore-cream p-4 text-sm">
        <p><strong>Student:</strong> {studentName}</p>
        <p><strong>School Year:</strong> {ctx.schoolYear}</p>
      </div>

      <ExportPortfolioForm portfolioId={ctx.portfolio._id.toString()} />

      <div className="rounded-xl bg-white p-5 shadow-sm text-sm text-explore-charcoal/70">
        <p className="font-semibold text-explore-charcoal">Export options</p>
        <ul className="mt-2 list-disc pl-5 space-y-1">
          <li>Download individual files from Work Samples, Activities, and Curriculum sections</li>
          <li>Download complete portfolio as ZIP with all original files</li>
          <li>Access remains available after portfolio submission and review</li>
        </ul>
      </div>
    </div>
  );
}
