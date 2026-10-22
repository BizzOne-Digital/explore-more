import type { ITeacherLessonPlan } from "@/models/TeacherWorkspace";

export function lessonPlanImportKey(raw: Record<string, unknown>): string {
  const title = String(raw.title ?? "").trim().toLowerCase();
  const subject = String(raw.subject ?? "").trim().toLowerCase();
  const grade = String(raw.grade ?? "").trim().toLowerCase();
  const date =
    raw.date != null ? new Date(String(raw.date)).toISOString().slice(0, 10) : "";
  return [title, subject, grade, date].join("|");
}

export function buildExistingImportKeys(
  plans: Array<Pick<ITeacherLessonPlan, "title" | "subject" | "grade" | "date">>
): Set<string> {
  const keys = new Set<string>();
  for (const p of plans) {
    keys.add(
      lessonPlanImportKey({
        title: p.title,
        subject: p.subject,
        grade: p.grade,
        date: p.date,
      })
    );
  }
  return keys;
}
