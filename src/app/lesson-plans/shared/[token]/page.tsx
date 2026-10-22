import { notFound } from "next/navigation";
import connectDB from "@/lib/db";
import { TeacherLessonPlan } from "@/models";
import { DETAILED_PLAN_SECTIONS, QUICK_PLAN_SECTIONS } from "@/lib/teacher/lesson-plan-fields";

export const dynamic = "force-dynamic";

export default async function SharedLessonPlanPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  await connectDB();
  const plan = await TeacherLessonPlan.findOne({
    shareToken: token,
    shareEnabled: true,
    archived: { $ne: true },
  }).lean();

  if (!plan) notFound();

  const sections =
    plan.planMode === "detailed" ? DETAILED_PLAN_SECTIONS : QUICK_PLAN_SECTIONS;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-10">
      <article className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">
          Explore More Academy — shared lesson plan
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-explore-charcoal">
          {plan.title}
        </h1>
        <p className="mt-2 text-sm text-gray-600">
          {[plan.subject, plan.grade, plan.date ? new Date(plan.date).toLocaleDateString() : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
        <div className="mt-8 space-y-6">
          {sections.map((s) => {
            const body = String((plan as unknown as Record<string, unknown>)[s.key] ?? "").trim();
            if (!body) return null;
            return (
              <section key={s.key}>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-teal-800">
                  {s.label}
                </h2>
                <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">{body}</p>
              </section>
            );
          })}
        </div>
      </article>
    </div>
  );
}
