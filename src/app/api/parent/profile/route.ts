import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { User, ParentProfile } from "@/models";
import { hashPassword, verifyPassword } from "@/lib/password";

export async function GET() {
  try {
    const sessionResult = await requireRole(["parent"]);
    if ("error" in sessionResult) return sessionResult.error;

    await connectDB();
    const [user, profile] = await Promise.all([
      User.findById(sessionResult.user.id).select("name email phone avatar guardianId notificationPreferences"),
      ParentProfile.findOne({ userId: sessionResult.user.id }).lean(),
    ]);

    if (!user) return apiError(new Error("User not found"), 404);

    return apiSuccess({ user, profile });
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const sessionResult = await requireRole(["parent"]);
    if ("error" in sessionResult) return sessionResult.error;

    const body = await request.json();
    await connectDB();

    const user = await User.findById(sessionResult.user.id);
    if (!user) return apiError(new Error("User not found"), 404);

    if (body.name) user.name = body.name.trim();
    if (body.email) user.email = body.email.trim().toLowerCase();
    if (body.phone !== undefined) user.phone = body.phone;
    if (body.avatar !== undefined) user.avatar = body.avatar;
    if (body.notificationPreferences) {
      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...body.notificationPreferences,
      };
    }

    if (body.newPassword) {
      if (!body.currentPassword) {
        return apiError(new Error("Current password is required to set a new password"), 400);
      }
      const valid = await verifyPassword(body.currentPassword, user.passwordHash);
      if (!valid) return apiError(new Error("Current password is incorrect"), 400);
      user.passwordHash = await hashPassword(body.newPassword);
    }

    await user.save();

    const profile = await ParentProfile.findOneAndUpdate(
      { userId: user._id },
      {
        firstName: body.firstName,
        lastName: body.lastName,
        mailingAddress: body.mailingAddress,
        emergencyContact: body.emergencyContact,
        preferredCommunication: body.preferredCommunication,
      },
      { upsert: true, new: true }
    );

    return apiSuccess({ user, profile });
  } catch (error) {
    return apiError(error);
  }
}
