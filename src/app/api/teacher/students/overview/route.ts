import { jsonOk } from "@/lib/api/response";
import { requireTeacherPortal } from "@/lib/teacher/api-auth";
import { getRosterSyncOverview } from "@/lib/teacher/student-sync-hub";

export const runtime = "nodejs";

export async function GET() {
  const sessionResult = await requireTeacherPortal();
  if ("error" in sessionResult) return sessionResult.error;

  const students = await getRosterSyncOverview(sessionResult.user.id);
  return jsonOk({ students });
}
