import { TeacherLessonPlansHub } from "@/components/teacher/lesson-plans/TeacherLessonPlansHub";

export const dynamic = "force-dynamic";

export default function TeacherLessonPlansPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-explore-charcoal">Lesson Plans</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Quick and detailed plans with AI assist, PDF export, templates, and revision history.
        </p>
      </div>
      <TeacherLessonPlansHub />
    </div>
  );
}
