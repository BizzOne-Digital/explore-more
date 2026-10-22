import connectDB from "@/lib/db";
import { User } from "@/models";
import { TeacherProductFeedback } from "@/models";
import { apiError, apiSuccess } from "@/lib/admin/api";
import { requireRole } from "@/lib/api/auth-helpers";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    await connectDB();
    const unreadOnly = new URL(request.url).searchParams.get("unread") === "1";

    const filter: Record<string, unknown> = {};
    if (unreadOnly) filter.reviewedAt = { $exists: false };

    const items = await TeacherProductFeedback.find(filter)
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const teacherIds = [...new Set(items.map((i) => String(i.teacherId)))];
    const teachers = await User.find({ _id: { $in: teacherIds } })
      .select("name email")
      .lean();
    const teacherMap = new Map(teachers.map((t) => [String(t._id), t]));

    const rows = items.map((item) => ({
      ...item,
      teacher: teacherMap.get(String(item.teacherId)) ?? null,
    }));

    return apiSuccess({ items: rows });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    const body = await request.json().catch(() => null);
    const id = body?.id;
    if (!id) return apiError(new Error("id required"), 400);

    await connectDB();
    const reviewed = body?.reviewed !== false;
    const doc = await TeacherProductFeedback.findByIdAndUpdate(
      id,
      { $set: { reviewedAt: reviewed ? new Date() : null } },
      { new: true }
    );
    if (!doc) return apiError(new Error("Not found"), 404);

    return apiSuccess({ item: doc });
  } catch (error) {
    return apiError(error);
  }
}
