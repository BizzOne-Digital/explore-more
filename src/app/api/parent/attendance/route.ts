import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { Attendance } from "@/models";
import { getAccessibleStudentId } from "@/lib/auth/access";
import { ATTENDANCE_STATUSES, dayBounds } from "@/lib/attendance/status";
import mongoose from "mongoose";

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

    const body = await request.json();
    const { studentId, sessionDate, status, customLabel, notes, note } = body;

    if (!studentId || !sessionDate) {
      return apiError(new Error("studentId and sessionDate are required"), 400);
    }

    const accessibleId = await getAccessibleStudentId(sessionResult.user, studentId);
    if (!accessibleId) return apiError(new Error("Access denied"), 403);

    await connectDB();

    if (status) {
      if (!ATTENDANCE_STATUSES.includes(status)) {
        return apiError(new Error("Invalid attendance status"), 400);
      }
      if (status === "other" && !customLabel?.trim()) {
        return apiError(new Error("Please enter a custom attendance status"), 400);
      }

      const { startOfDay, endOfDay } = dayBounds(sessionDate);
      const recordNotes =
        status === "other"
          ? [customLabel.trim(), notes?.trim()].filter(Boolean).join(" — ") || customLabel.trim()
          : notes?.trim() || undefined;

      const record = await Attendance.findOneAndUpdate(
        {
          studentId: accessibleId,
          isDailyLog: true,
          sessionDate: { $gte: startOfDay, $lte: endOfDay },
        },
        {
          $set: {
            studentId: new mongoose.Types.ObjectId(accessibleId),
            sessionDate: startOfDay,
            status,
            notes: recordNotes,
            recordedBy: new mongoose.Types.ObjectId(sessionResult.user.id),
            isDailyLog: true,
          },
        },
        { upsert: true, new: true, runValidators: true }
      );

      return apiSuccess({
        record,
        message: "Daily attendance saved.",
      });
    }

    if (!note?.trim()) {
      return apiError(new Error("studentId, sessionDate, and note are required"), 400);
    }

    const { startOfDay, endOfDay } = dayBounds(sessionDate);

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
