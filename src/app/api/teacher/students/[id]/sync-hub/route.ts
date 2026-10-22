import { jsonError, jsonOk } from "@/lib/api/response";
import { requireTeacherPortal } from "@/lib/teacher/api-auth";
import { getStudentSyncHub } from "@/lib/teacher/student-sync-hub";
import mongoose from "mongoose";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const sessionResult = await requireTeacherPortal();
  if ("error" in sessionResult) return sessionResult.error;

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  const hub = await getStudentSyncHub(sessionResult.user.id, id);
  if (!hub) return jsonError("Not found", 404);

  return jsonOk(hub);
}
