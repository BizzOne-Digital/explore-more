import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import connectDB from "@/lib/db";
import { PortfolioCurriculum } from "@/models";
import { resolveParentContext } from "@/lib/parent/context";
import { PortfolioSubNav } from "@/components/parent/ParentNav";
import { StudentYearSelector } from "@/components/parent/StudentYearSelector";
import { CurriculumForm } from "@/components/parent/PortfolioForms";

export default async function CurriculumPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; year?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/parent/login?callbackUrl=/parent/portfolio/curriculum");

  const params = await searchParams;
  const ctx = await resolveParentContext(session.user.id, params);
  if (!ctx.studentId || !ctx.portfolio) redirect("/parent/portfolio");

  await connectDB();
  const items = await PortfolioCurriculum.find({ portfolioId: ctx.portfolio._id }).sort({ subject: 1 });

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">Curriculum & Educational Materials</h2>
      <Suspense fallback={null}>
        <StudentYearSelector students={ctx.students.map((s) => ({ id: s.id, name: s.name }))} selectedStudentId={ctx.studentId} selectedYear={ctx.schoolYear} />
        <PortfolioSubNav />
      </Suspense>
      <CurriculumForm studentId={ctx.studentId} schoolYear={ctx.schoolYear} />
      <div className="space-y-3">
        {items.map((item) => (
          <article key={item._id.toString()} className="rounded-xl bg-white p-5 shadow-sm">
            <p className="text-xs font-semibold uppercase text-explore-teal">{item.subject}</p>
            <h3 className="font-semibold">{item.materialName}</h3>
            {item.description && <p className="mt-1 text-sm text-explore-charcoal/70">{item.description}</p>}
            {item.files.length > 0 && (
              <ul className="mt-2 flex flex-wrap gap-2">
                {item.files.map((f) => (
                  <li key={f.path}>
                    <a href={`/api/files/private/${f.path}`} className="text-xs text-explore-teal hover:underline">
                      {f.originalName}
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
