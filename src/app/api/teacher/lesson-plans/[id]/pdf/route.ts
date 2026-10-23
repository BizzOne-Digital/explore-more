import connectDB from "@/lib/db";
import { jsonError } from "@/lib/api/response";
import { requireTeacherPortal } from "@/lib/teacher/api-auth";
import { TeacherLessonPlan } from "@/models";
import {
  buildLessonPlanPdfBytes,
  lessonPlanPdfFilename,
} from "@/lib/teacher/lesson-plan-pdf-build";
import mongoose from "mongoose";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const sessionResult = await requireTeacherPortal();
  if ("error" in sessionResult) return sessionResult.error;

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  await connectDB();
  const plan = await TeacherLessonPlan.findOne({
    _id: id,
    teacherId: sessionResult.user.id,
  }).lean();
  if (!plan) return jsonError("Not found", 404);

  const pdf = await buildLessonPlanPdfBytes(sessionResult.user.id, plan);
  const filename = lessonPlanPdfFilename(plan.title);
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
