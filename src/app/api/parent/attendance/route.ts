import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { Attendance } from "@/models";
import { getAccessibleStudentId } from "@/lib/auth/access";

export async function GET(request: Request) {
  try {
    const sessionResult = await requireRole(["parent"]);
    if ("error" in sessionResult) return sessionResult.error;

    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId");
    const month = searchParams.get("month");

    if (!studentId) return apiError(new Error("studentId is required"), 400);

    const accessibleId = await getAccessibleStudentId(sessionResult.user, studentId);
    if (!accessibleId) return apiError(new Error("Access denied"), 403);

    await connectDB();

    const query: Record<string, unknown> = { studentId: accessibleId };
    if (month) {
      const start = new Date(`${month}-01`);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59);
      query.sessionDate = { $gte: start, $lte: end };
    }

    const records = await Attendance.find(query)
      .populate("courseId", "title")
      .populate("eventId", "title")
      .sort({ sessionDate: -1 })
      .lean();

    return apiSuccess({ records });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const sessionResult = await requireRole(["parent"]);
    if ("error" in sessionResult) return sessionResult.error;

    const { studentId, sessionDate, note } = await request.json();
    if (!studentId || !sessionDate || !note?.trim()) {
      return apiError(new Error("studentId, sessionDate, and note are required"), 400);
    }

    const accessibleId = await getAccessibleStudentId(sessionResult.user, studentId);
    if (!accessibleId) return apiError(new Error("Access denied"), 403);

    await connectDB();

    const date = new Date(sessionDate);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const record = await Attendance.findOneAndUpdate(
      {
        studentId: accessibleId,
        sessionDate: { $gte: startOfDay, $lte: endOfDay },
      },
      {
        $set: {
          parentExcuseNote: note.trim(),
          parentExcuseSubmittedAt: new Date(),
        },
      },
      { new: true }
    );

    if (!record) {
      return apiSuccess({
        message:
          "Your excuse note was received. Staff will attach it when attendance is recorded for that date.",
        pending: true,
      });
    }

    return apiSuccess({ record, message: "Excuse note submitted for the attendance record." });
  } catch (error) {
    return apiError(error);
  }
}
