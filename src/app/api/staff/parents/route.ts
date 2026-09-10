import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { User } from "@/models";
import { STAFF_PORTAL_ROLES } from "@/lib/constants";

export async function GET() {
  try {
    const sessionResult = await requireRole([...STAFF_PORTAL_ROLES]);
    if ("error" in sessionResult) return sessionResult.error;

    await connectDB();
    const parents = await User.find({
      role: "parent",
      isActive: { $ne: false },
    })
      .select("name email")
      .sort({ name: 1 })
      .limit(500)
      .lean();

    return apiSuccess(
      parents.map((parent) => ({
        _id: parent._id.toString(),
        name: parent.name,
        email: parent.email,
      }))
    );
  } catch (error) {
    return apiError(error);
  }
}
