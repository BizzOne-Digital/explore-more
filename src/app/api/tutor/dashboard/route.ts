import connectDB from "@/lib/db";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireTutorPortal } from "@/lib/tutor/api-auth";
import { getTutorDashboardStats, getTutorProfile } from "@/lib/tutor/queries";

export async function GET() {
  const sessionResult = await requireTutorPortal();
  if ("error" in sessionResult) return sessionResult.error;

  await connectDB();
  const [profile, stats] = await Promise.all([
    getTutorProfile(sessionResult.user.id),
    getTutorDashboardStats(sessionResult.user.id),
  ]);

  return jsonOk({ profile, stats });
}
