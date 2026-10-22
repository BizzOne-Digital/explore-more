import connectDB from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireTeacherPortal } from "@/lib/teacher/api-auth";
import { TeacherLessonPlan } from "@/models";
import { currentSchoolYear } from "@/lib/tutor/school-year";
import { pickLessonPlanFields } from "@/lib/teacher/lesson-plan-fields";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const sessionResult = await requireTeacherPortal();
  if ("error" in sessionResult) return sessionResult.error;

  const body = await request.json().catch(() => null);
  const plans = body?.lessonPlans;
  if (!Array.isArray(plans) || plans.length === 0) {
    return jsonError("lessonPlans array required", 400);
  }
  if (plans.length > 200) return jsonError("Too many plans (max 200)", 400);

  await connectDB();
  const teacherId = sessionResult.user.id;
  const schoolYear = currentSchoolYear();

  let imported = 0;
  for (const raw of plans) {
    if (!raw || typeof raw !== "object") continue;
    const fields = pickLessonPlanFields(raw as Record<string, unknown>);
    const title = typeof raw.title === "string" ? raw.title : "Imported lesson";
    await TeacherLessonPlan.create({
      teacherId,
      schoolYear,
      title,
      ...fields,
      isTemplate: false,
      archived: false,
    });
    imported += 1;
  }

  return jsonOk({ imported });
}
