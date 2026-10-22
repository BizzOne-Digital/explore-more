import connectDB from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireTeacherPortal } from "@/lib/teacher/api-auth";
import { TeacherLessonPlan, TeacherLessonPlanRevision } from "@/models";
import mongoose from "mongoose";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const sessionResult = await requireTeacherPortal();
  if ("error" in sessionResult) return sessionResult.error;

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  await connectDB();
  const owns = await TeacherLessonPlan.exists({ _id: id, teacherId: sessionResult.user.id });
  if (!owns) return jsonError("Not found", 404);

  const items = await TeacherLessonPlanRevision.find({ lessonPlanId: id })
    .sort({ createdAt: -1 })
    .limit(25)
    .select("createdAt note")
    .lean();

  return jsonOk({ items });
}
