import connectDB from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireTeacherPortal } from "@/lib/teacher/api-auth";
import { TeacherProductFeedback } from "@/models";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const sessionResult = await requireTeacherPortal();
  if ("error" in sessionResult) return sessionResult.error;

  const body = await request.json().catch(() => null);
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (message.length < 5) return jsonError("Message is required", 400);

  await connectDB();
  const doc = await TeacherProductFeedback.create({
    teacherId: sessionResult.user.id,
    category: typeof body?.category === "string" ? body.category : "general",
    message,
  });

  return jsonOk({ id: doc._id.toString() }, 201);
}
