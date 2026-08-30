import connectDB from "@/lib/db";
import { jsonOk } from "@/lib/api/response";
import { requireTutorPortal } from "@/lib/tutor/api-auth";
import { listTutorStudents } from "@/lib/tutor/queries";

export async function GET() {
  const sessionResult = await requireTutorPortal();
  if ("error" in sessionResult) return sessionResult.error;

  await connectDB();
  const students = await listTutorStudents(sessionResult.user.id);
  return jsonOk({ students });
}
