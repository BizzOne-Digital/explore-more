import connectDB from "@/lib/db";
import { jsonOk } from "@/lib/api/response";
import { requireTutorPortal } from "@/lib/tutor/api-auth";
import { listStudentsForResourcePublish } from "@/lib/tutor/queries";

export async function GET() {
  const sessionResult = await requireTutorPortal();
  if ("error" in sessionResult) return sessionResult.error;

  await connectDB();
  const students = await listStudentsForResourcePublish(
    sessionResult.user.id,
    sessionResult.user.role
  );
  return jsonOk({ students });
}
