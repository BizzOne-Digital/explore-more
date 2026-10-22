import connectDB from "@/lib/db";
import { jsonOk } from "@/lib/api/response";
import { requireTeacherPortal } from "@/lib/teacher/api-auth";
import { TeacherLessonPlan } from "@/models";
import { currentSchoolYear } from "@/lib/tutor/school-year";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const sessionResult = await requireTeacherPortal();
  if ("error" in sessionResult) return sessionResult.error;

  await connectDB();
  const schoolYear =
    new URL(request.url).searchParams.get("schoolYear") ?? currentSchoolYear();

  const items = await TeacherLessonPlan.find({
    teacherId: sessionResult.user.id,
    schoolYear,
  })
    .sort({ updatedAt: -1 })
    .lean();

  return jsonOk({
    exportedAt: new Date().toISOString(),
    schoolYear,
    lessonPlans: items,
  });
}
