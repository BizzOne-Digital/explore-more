import connectDB from "@/lib/db";
import { School, TeacherSchoolMembership, User } from "@/models";
import { apiError, apiSuccess, isValidObjectId } from "@/lib/admin/api";
import { requireRole } from "@/lib/api/auth-helpers";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(new Error("Invalid school id"), 400);

    await connectDB();
    const school = await School.findById(id).lean();
    if (!school) return apiError(new Error("School not found"), 404);

    const memberships = await TeacherSchoolMembership.find({ schoolId: id }).lean();
    const teacherIds = memberships.map((m) => m.userId);
    const teachers = teacherIds.length
      ? await User.find({ _id: { $in: teacherIds }, role: "teacher" })
          .select("name email")
          .sort({ name: 1 })
          .lean()
      : [];

    return apiSuccess({
      school,
      teachers: teachers.map((t) => ({
        _id: t._id.toString(),
        name: t.name,
        email: t.email,
      })),
    });
  } catch (error) {
    return apiError(error);
  }
}
