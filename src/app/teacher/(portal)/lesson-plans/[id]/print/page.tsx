import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { TEACHER_PORTAL_ROLES } from "@/lib/constants";
import { TeacherLessonPlan } from "@/models";
import { DETAILED_PLAN_SECTIONS, QUICK_PLAN_SECTIONS } from "@/lib/teacher/lesson-plan-fields";
import { LessonPlanPrintActions } from "@/components/teacher/lesson-plans/LessonPlanPrintActions";

export const dynamic = "force-dynamic";

export default async function LessonPlanPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (
    !session?.user ||
    !TEACHER_PORTAL_ROLES.includes(session.user.role as (typeof TEACHER_PORTAL_ROLES)[number])
  ) {
    redirect("/tutor/login");
  }

  const { id } = await params;
  await connectDB();
  const plan = await TeacherLessonPlan.findOne({
    _id: id,
    teacherId: session.user.id,
  }).lean();
  if (!plan) notFound();

  const sections =
    plan.planMode === "detailed" ? DETAILED_PLAN_SECTIONS : QUICK_PLAN_SECTIONS;

  return (
    <div className="mx-auto max-w-3xl space-y-6 bg-white p-8 print:p-0">
      <LessonPlanPrintActions />
      <header>
        <h1 className="font-display text-2xl font-bold">{plan.title}</h1>
        <p className="mt-1 text-sm text-gray-600">
          {[plan.subject, plan.grade, plan.date ? new Date(plan.date).toLocaleDateString() : null]
            .filter(Boolean)
            .join(" · ")}
        </p>
      </header>
      {sections.map((s) => {
        const body = String((plan as unknown as Record<string, unknown>)[s.key] ?? "").trim();
        if (!body) return null;
        return (
          <section key={s.key}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-teal-800">{s.label}</h2>
            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-800">{body}</p>
          </section>
        );
      })}
    </div>
  );
}
