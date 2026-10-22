import { TeacherLessonPlanEditor } from "@/components/teacher/lesson-plans/TeacherLessonPlanEditor";

export const dynamic = "force-dynamic";

export default async function EditLessonPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold text-explore-charcoal">Edit lesson plan</h2>
      <TeacherLessonPlanEditor planId={id} />
    </div>
  );
}
