import crypto from "crypto";
import connectDB from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireTeacherPortal } from "@/lib/teacher/api-auth";
import { TeacherLessonPlan } from "@/models";
import mongoose from "mongoose";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const sessionResult = await requireTeacherPortal();
  if ("error" in sessionResult) return sessionResult.error;

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  const body = await request.json().catch(() => ({}));
  const enable = body?.enable !== false;

  await connectDB();
  const plan = await TeacherLessonPlan.findOne({ _id: id, teacherId: sessionResult.user.id });
  if (!plan) return jsonError("Not found", 404);

  if (!enable) {
    plan.shareEnabled = false;
    await plan.save();
    return jsonOk({ shareEnabled: false });
  }

  if (!plan.shareToken) {
    plan.shareToken = crypto.randomBytes(24).toString("hex");
  }
  plan.shareEnabled = true;
  await plan.save();

  const origin = new URL(request.url).origin;
  return jsonOk({
    shareEnabled: true,
    shareToken: plan.shareToken,
    shareUrl: `${origin}/lesson-plans/shared/${plan.shareToken}`,
  });
}
