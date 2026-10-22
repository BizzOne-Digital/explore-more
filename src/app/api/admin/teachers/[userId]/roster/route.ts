import { z } from "zod";
import connectDB from "@/lib/db";
import { TeacherClassRoster, User } from "@/models";
import { apiSuccess, apiError, isValidObjectId } from "@/lib/admin/api";
import { requireRole } from "@/lib/api/auth-helpers";
import { getPrimarySchoolForTeacher } from "@/lib/teacher/school";
import { currentSchoolYear } from "@/lib/tutor/school-year";
import { listTeacherRoster } from "@/lib/teacher/roster";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ userId: string }> };

const addSchema = z.object({
  studentId: z.string().min(1),
  grade: z.string().max(40).optional(),
  className: z.string().max(80).optional(),
  schoolYear: z.string().max(20).optional(),
});

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    const { userId } = await params;
    if (!isValidObjectId(userId)) return apiError(new Error("Invalid teacher id"), 400);

    const teacher = await User.findById(userId).select("role name").lean();
    if (!teacher || teacher.role !== "teacher") {
      return apiError(new Error("User is not a school teacher"), 400);
    }

    const students = await listTeacherRoster(userId);
    return apiSuccess({ students });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    const { userId } = await params;
    if (!isValidObjectId(userId)) return apiError(new Error("Invalid teacher id"), 400);

    const body = addSchema.parse(await request.json());
    if (!isValidObjectId(body.studentId)) {
      return apiError(new Error("Invalid student id"), 400);
    }

    await connectDB();
    const teacher = await User.findById(userId).select("role").lean();
    if (!teacher || teacher.role !== "teacher") {
      return apiError(new Error("User is not a school teacher"), 400);
    }

    const student = await User.findById(body.studentId).select("role name").lean();
    if (!student || student.role !== "student") {
      return apiError(new Error("Selected user is not a student account"), 400);
    }

    const ctx = await getPrimarySchoolForTeacher(userId);
    if (!ctx) {
      return apiError(new Error("Assign this teacher to a school before adding roster students"), 400);
    }

    const schoolYear = body.schoolYear ?? currentSchoolYear();

    const row = await TeacherClassRoster.findOneAndUpdate(
      { teacherId: userId, studentId: body.studentId, schoolYear },
      {
        $set: {
          schoolId: ctx.school._id,
          teacherId: userId,
          studentId: body.studentId,
          schoolYear,
          grade: body.grade?.trim() || undefined,
          className: body.className?.trim() || undefined,
        },
      },
      { upsert: true, new: true }
    );

    return apiSuccess({ roster: row }, 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    const { userId } = await params;
    const rosterId = new URL(request.url).searchParams.get("rosterId");
    if (!isValidObjectId(userId) || !rosterId || !isValidObjectId(rosterId)) {
      return apiError(new Error("Invalid id"), 400);
    }

    await connectDB();
    const removed = await TeacherClassRoster.findOneAndDelete({
      _id: rosterId,
      teacherId: userId,
    });
    if (!removed) return apiError(new Error("Roster entry not found"), 404);

    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
