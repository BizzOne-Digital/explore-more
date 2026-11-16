import connectDB from "@/lib/db";
import {
  User,
  StudentProfile,
  InstructorProfile,
  ParentProfile,
  ParentSubscription,
  GuardianStudentLink,
  TeacherSchoolMembership,
  School,
} from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { auth } from "@/lib/auth";
import { logActivity, extractChanges, getIpAddress, getUserAgent } from "@/lib/admin/audit-log";
import { ensureTutorId } from "@/lib/tutor/tutor-id";
import { cancelSubscription } from "@/lib/billing/subscription-management";
import bcrypt from "bcryptjs";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(new Error("Unauthorized"), 401);
    }

    await connectDB();
    const { id } = await params;

    const user = await User.findById(id).lean();
    if (!user) {
      return apiError(new Error("User not found"), 404);
    }

    if (user.role === "instructor" || user.role === "administrator") {
      await ensureTutorId(id);
    }

    const freshUser = await User.findById(id).lean();
    if (!freshUser) {
      return apiError(new Error("User not found"), 404);
    }

    // Get related data
    let profile = null;
    let guardianLinks: unknown[] = [];
    let studentLinks: unknown[] = [];

    if (freshUser.role === "student") {
      profile = await StudentProfile.findOne({ userId: id }).lean();
      guardianLinks = await GuardianStudentLink.find({ studentId: id })
        .populate("guardianId", "name email")
        .lean();
    } else if (freshUser.role === "instructor") {
      profile = await InstructorProfile.findOne({ userId: id }).lean();
    } else if (freshUser.role === "parent") {
      const { ParentProfile } = await import("@/models");
      profile = await ParentProfile.findOne({ userId: id }).lean();
      studentLinks = await GuardianStudentLink.find({ guardianId: id })
        .populate("studentId", "name email studentId")
        .lean();
    }

    let teacherSchool: {
      school: { _id: string; name: string; slug: string };
      jobTitle?: string;
    } | null = null;

    if (freshUser.role === "teacher") {
      const membership = await TeacherSchoolMembership.findOne({ userId: id })
        .sort({ isPrimary: -1, updatedAt: -1 })
        .lean();
      if (membership) {
        const school = await School.findById(membership.schoolId).lean();
        if (school) {
          teacherSchool = {
            school: {
              _id: school._id.toString(),
              name: school.name,
              slug: school.slug,
            },
            jobTitle: membership.jobTitle,
          };
        }
      }
    }

    return apiSuccess({
      user: freshUser,
      profile,
      guardianLinks,
      studentLinks,
      teacherSchool,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(new Error("Unauthorized"), 401);
    }

    await connectDB();
    const { id } = await params;
    const body = await request.json();

    // Get current user for comparison
    const currentUser = await User.findById(id).lean();
    if (!currentUser) {
      return apiError(new Error("User not found"), 404);
    }

    // Prepare update data
    const updateData: Record<string, unknown> = {
      name: body.name,
      email: body.email,
      phone: body.phone,
      role: body.role,
      isActive: body.isActive,
    };

    // Handle password update if provided
    if (body.password && body.password.trim()) {
      updateData.passwordHash = await bcrypt.hash(body.password, 10);
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    }).lean();

    if (!updatedUser) {
      return apiError(new Error("Failed to update user"), 500);
    }

    // Extract changes for audit log
    const changes = extractChanges(
      currentUser as unknown as Record<string, unknown>,
      updatedUser as unknown as Record<string, unknown>,
      ["passwordHash", "__v", "updatedAt"]
    );

    // Log the activity
    await logActivity({
      performedBy: session.user.id,
      action: "update",
      entity: "user",
      entityId: id,
      userId: id,
      changes,
      details: `Updated user: ${updatedUser.name}`,
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return apiSuccess(updatedUser);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(new Error("Unauthorized"), 401);
    }
    if (session.user.role !== "administrator") {
      return apiError(new Error("Only administrators can delete users"), 403);
    }

    await connectDB();
    const { id } = await params;

    if (id === session.user.id) {
      return apiError(new Error("You cannot delete your own account"), 400);
    }

    const user = await User.findById(id);
    if (!user) {
      return apiError(new Error("User not found"), 404);
    }

    // A live Stripe subscription must not be orphaned (the parent would keep being billed).
    // Active accounts are blocked. Inactive (deactivated) accounts have their subscription
    // cancelled immediately, then are deleted. If cancelling fails, nothing is deleted.
    if (user.role === "parent") {
      const liveSubscription = await ParentSubscription.findOne({
        userId: id,
        stripeSubscriptionId: { $exists: true, $ne: null },
        status: { $in: ["active", "trialing", "past_due", "paused"] },
      }).lean();
      if (liveSubscription) {
        if (user.isActive !== false) {
          return apiError(
            new Error(
              "This parent has an active subscription. Deactivate the account first, then delete it."
            ),
            409
          );
        }
        try {
          await cancelSubscription(id, false);
        } catch (cancelError) {
          const reason = cancelError instanceof Error ? cancelError.message : "Unknown error";
          // Stripe has no such subscription (stale or removed ID): nothing left to cancel.
          const alreadyGone =
            (cancelError as { code?: string } | null)?.code === "resource_missing" ||
            /^No such subscription/i.test(reason);
          if (!alreadyGone) {
            return apiError(
              new Error(`Could not cancel the parent's subscription, so the account was not deleted. ${reason}`),
              409
            );
          }
        }
      }
    }

    // Store user info for logging
    const userName = user.name;
    const userEmail = user.email;

    // Delete related data (orders and donations are kept for financial records)
    if (user.role === "student") {
      await StudentProfile.deleteOne({ userId: id });
      await GuardianStudentLink.deleteMany({ studentId: id });
    } else if (user.role === "instructor") {
      await InstructorProfile.deleteOne({ userId: id });
    } else if (user.role === "parent") {
      await GuardianStudentLink.deleteMany({ guardianId: id });
      await ParentProfile.deleteOne({ userId: id });
      await ParentSubscription.deleteOne({ userId: id });
    } else if (user.role === "teacher") {
      await TeacherSchoolMembership.deleteMany({ userId: id });
    }

    // Delete the user
    await User.findByIdAndDelete(id);

    // Log the activity
    await logActivity({
      performedBy: session.user.id,
      action: "delete",
      entity: "user",
      entityId: id,
      userId: id,
      details: `Deleted user: ${userName} (${userEmail})`,
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
