import { jsonError, jsonOk } from "@/lib/api/response";
import { requireTeacherPortal } from "@/lib/teacher/api-auth";
import { listTeacherRoster } from "@/lib/teacher/roster";
import { currentSchoolYear } from "@/lib/tutor/school-year";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const sessionResult = await requireTeacherPortal();
  if ("error" in sessionResult) return sessionResult.error;

  const schoolYear =
    new URL(request.url).searchParams.get("schoolYear") ?? currentSchoolYear();

  const students = await listTeacherRoster(sessionResult.user.id, schoolYear);
  return jsonOk({ students, schoolYear });
}
