import connectDB from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireTeacherPortal } from "@/lib/teacher/api-auth";
import { TeacherLessonPlan } from "@/models";
import { currentSchoolYear } from "@/lib/tutor/school-year";
import mongoose from "mongoose";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const sessionResult = await requireTeacherPortal();
  if ("error" in sessionResult) return sessionResult.error;

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  await connectDB();
  const source = await TeacherLessonPlan.findOne({
    _id: id,
    teacherId: sessionResult.user.id,
  }).lean();
  if (!source) return jsonError("Not found", 404);

  const rest = { ...source };
  delete (rest as { _id?: unknown })._id;
  delete (rest as { createdAt?: unknown }).createdAt;
  delete (rest as { updatedAt?: unknown }).updatedAt;
  const doc = await TeacherLessonPlan.create({
    ...rest,
    teacherId: sessionResult.user.id,
    schoolYear: currentSchoolYear(),
    title: `${source.title} (copy)`,
    status: "draft",
    archived: false,
    isTemplate: false,
  });

  return jsonOk({ item: doc }, 201);
}
