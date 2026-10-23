import type { ITeacherLessonPlan } from "@/models/TeacherWorkspace";
import { getPrimarySchoolForTeacher } from "@/lib/teacher/school";
import { generateLessonPlanPdf } from "@/lib/pdf/lesson-plan-pdf";
import { DETAILED_PLAN_SECTIONS, QUICK_PLAN_SECTIONS } from "@/lib/teacher/lesson-plan-fields";

export type LessonPlanLean = Pick<
  ITeacherLessonPlan,
  | "title"
  | "subject"
  | "grade"
  | "date"
  | "status"
  | "planMode"
  | "learningObjective"
  | "essentialQuestion"
  | "materials"
  | "warmUp"
  | "instruction"
  | "assessment"
  | "homework"
  | "differentiation"
  | "reflection"
  | "notes"
>;

export function lessonPlanPdfFilename(title: string) {
  return `lesson-plan-${title.replace(/[^\w.-]+/g, "_").slice(0, 60)}.pdf`;
}

export async function buildLessonPlanPdfBytes(
  teacherId: string,
  plan: LessonPlanLean
): Promise<Uint8Array> {
  const schoolCtx = await getPrimarySchoolForTeacher(teacherId);
  const sections =
    plan.planMode === "detailed" ? DETAILED_PLAN_SECTIONS : QUICK_PLAN_SECTIONS;

  return generateLessonPlanPdf({
    title: plan.title,
    schoolName: schoolCtx?.school.name,
    subject: plan.subject,
    grade: plan.grade,
    date: plan.date ? new Date(plan.date).toLocaleDateString() : undefined,
    status: plan.status,
    planMode: plan.planMode,
    sections: sections.map((s) => ({
      label: s.label,
      body: String((plan as Record<string, unknown>)[s.key] ?? ""),
    })),
  });
}
