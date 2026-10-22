import connectDB from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireTeacherPortal } from "@/lib/teacher/api-auth";
import { TeacherLessonPlan } from "@/models";
import { currentSchoolYear } from "@/lib/tutor/school-year";
import { pickLessonPlanFields } from "@/lib/teacher/lesson-plan-fields";
import {
  buildExistingImportKeys,
  lessonPlanImportKey,
} from "@/lib/teacher/lesson-plan-import";
import { syncLessonPlanToPlanner } from "@/lib/teacher/lesson-plan-planner-sync";

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

  const existing = await TeacherLessonPlan.find({ teacherId, schoolYear })
    .select("title subject grade date")
    .lean();
  const existingKeys = buildExistingImportKeys(existing);
  const batchKeys = new Set<string>();

  let imported = 0;
  let skipped = 0;

  for (const raw of plans) {
    if (!raw || typeof raw !== "object") continue;
    const key = lessonPlanImportKey(raw as Record<string, unknown>);
    if (!key.startsWith("|") && key.length > 1) {
      if (existingKeys.has(key) || batchKeys.has(key)) {
        skipped += 1;
        continue;
      }
      batchKeys.add(key);
    }

    const fields = pickLessonPlanFields(raw as Record<string, unknown>);
    const title = typeof raw.title === "string" ? raw.title : "Imported lesson";
    const doc = await TeacherLessonPlan.create({
      teacherId,
      schoolYear,
      title,
      ...fields,
      isTemplate: false,
      archived: false,
      shareEnabled: false,
    });
    existingKeys.add(key);
    await syncLessonPlanToPlanner(doc);
    imported += 1;
  }

  return jsonOk({ imported, skipped });
}
