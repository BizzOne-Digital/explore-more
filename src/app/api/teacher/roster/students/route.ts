import { z } from "zod";
import connectDB from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireTeacherPortal } from "@/lib/teacher/api-auth";
import { createStudentAndAddToRoster } from "@/lib/teacher/create-roster-student";

export const runtime = "nodejs";

const bodySchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).optional(),
  grade: z.string().max(40).optional(),
  className: z.string().max(80).optional(),
});

export async function POST(request: Request) {
  const sessionResult = await requireTeacherPortal();
  if ("error" in sessionResult) return sessionResult.error;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) return jsonError("Name and valid email are required", 400);

  await connectDB();
  try {
    const result = await createStudentAndAddToRoster({
      teacherUserId: sessionResult.user.id,
      ...parsed.data,
    });
    return jsonOk(result, 201);
  } catch (e) {
    return jsonError(e instanceof Error ? e.message : "Could not add student", 400);
  }
}
