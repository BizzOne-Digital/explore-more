import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import connectDB from "@/lib/db";
import { PortfolioActivity } from "@/models";
import { resolveParentContext } from "@/lib/parent/context";
import { PortfolioSubNav } from "@/components/parent/ParentNav";
import { StudentYearSelector } from "@/components/parent/StudentYearSelector";
import { ActivityForm } from "@/components/parent/PortfolioForms";

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; year?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/parent/portfolio/activities");

  const params = await searchParams;
  const ctx = await resolveParentContext(session.user.id, params);
  if (!ctx.studentId || !ctx.portfolio) redirect("/parent/portfolio");

  await connectDB();
  const activities = await PortfolioActivity.find({ portfolioId: ctx.portfolio._id }).sort({ date: -1 });

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">Activity Logs</h2>
      <Suspense fallback={null}>
        <StudentYearSelector students={ctx.students.map((s) => ({ id: s.id, name: s.name }))} selectedStudentId={ctx.studentId} selectedYear={ctx.schoolYear} />
        <PortfolioSubNav />
      </Suspense>
      <ActivityForm studentId={ctx.studentId} schoolYear={ctx.schoolYear} />
      <div className="space-y-3">
        {activities.map((a) => (
          <article key={a._id.toString()} className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-explore-teal">{a.category}</p>
            <h3 className="font-semibold">{a.activityName}</h3>
            <p className="text-sm text-explore-charcoal/60">
              {new Date(a.date).toLocaleDateString()}
              {a.hours ? ` · ${a.hours} hrs` : ""}
              {a.location ? ` · ${a.location}` : ""}
            </p>
            {a.learned && <p className="mt-2 text-sm">{a.learned}</p>}
          </article>
        ))}
      </div>
    </div>
  );
}
