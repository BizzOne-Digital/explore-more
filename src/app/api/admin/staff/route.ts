import connectDB from "@/lib/db";
import { STAFF_PORTAL_ROLES } from "@/lib/constants";
import { User } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";

/** Active staff/instructors/administrators for account manager assignment. */
export async function GET() {
  try {
    await connectDB();
    const staff = await User.find({
      role: { $in: STAFF_PORTAL_ROLES },
      isActive: true,
    })
      .select("name staffId role email")
      .sort({ name: 1 })
      .lean();

    return apiSuccess(staff);
  } catch (error) {
    return apiError(error);
  }
}
