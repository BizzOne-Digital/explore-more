import { TeacherLessonPlanEditor } from "@/components/teacher/lesson-plans/TeacherLessonPlanEditor";

export const dynamic = "force-dynamic";

export default async function NewLessonPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  const initialMode = mode === "detailed" ? "detailed" : "quick";
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold text-explore-charcoal">New lesson plan</h2>
      <TeacherLessonPlanEditor initialMode={initialMode} />
    </div>
  );
}
