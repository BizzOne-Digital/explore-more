import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import connectDB from "@/lib/db";
import { PortfolioReadingEntry } from "@/models";
import { resolveParentContext } from "@/lib/parent/context";
import { PortfolioSubNav } from "@/components/parent/ParentNav";
import { StudentYearSelector } from "@/components/parent/StudentYearSelector";
import { ReadingEntryForm } from "@/components/parent/PortfolioForms";
import { READING_TYPE_LABELS } from "@/lib/portfolio/constants";

export default async function ReadingPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; year?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/parent/portfolio/reading");

  const params = await searchParams;
  const ctx = await resolveParentContext(session.user.id, params);
  if (!ctx.studentId || !ctx.portfolio) redirect("/parent/portfolio");

  await connectDB();
  const entries = await PortfolioReadingEntry.find({ portfolioId: ctx.portfolio._id }).sort({ dateCompleted: -1 });

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">Reading & Resources Log</h2>
      <Suspense fallback={null}>
        <StudentYearSelector students={ctx.students.map((s) => ({ id: s.id, name: s.name }))} selectedStudentId={ctx.studentId} selectedYear={ctx.schoolYear} />
        <PortfolioSubNav />
      </Suspense>
      <ReadingEntryForm studentId={ctx.studentId} schoolYear={ctx.schoolYear} />
      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-explore-sand text-left">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Author</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Completed</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e._id.toString()} className="border-t border-explore-charcoal/8">
                <td className="px-4 py-3 font-medium">{e.bookTitle}</td>
                <td className="px-4 py-3">{e.author ?? "—"}</td>
                <td className="px-4 py-3">{READING_TYPE_LABELS[e.resourceType]}</td>
                <td className="px-4 py-3">{e.dateCompleted ? new Date(e.dateCompleted).toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
