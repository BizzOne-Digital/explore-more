import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { StaffProfile, User } from "@/models";
import { STAFF_CATEGORY_LABELS } from "@/lib/portfolio/constants";

export async function GET() {
  try {
    const sessionResult = await requireRole(["parent", "administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    await connectDB();

    const staffUsers = await User.find({
      role: { $in: ["staff", "instructor", "administrator"] },
      isActive: true,
    }).select("name email role");

    const profiles = await StaffProfile.find({ isPublished: true, messagingAvailable: true });
    const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

    const directory = staffUsers
      .map((user) => {
        const profile = profileMap.get(user._id.toString());
        const categories = profile?.categories?.length
          ? profile.categories
          : user.role === "administrator" || user.role === "staff"
            ? (["administration"] as const)
            : (["tutor"] as const);

        return {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          title: profile?.title ?? (user.role === "administrator" ? "Administration" : user.role === "staff" ? "Staff" : "Instructor"),
          bio: profile?.bio,
          categories: categories.map((c) => ({ id: c, label: STAFF_CATEGORY_LABELS[c] })),
          specialties: profile?.specialties ?? [],
        };
      })
      .filter((s) => s.categories.length > 0);

    return apiSuccess(directory);
  } catch (error) {
    return apiError(error);
  }
}
