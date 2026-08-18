import connectDB from "@/lib/db";
import { User, StudentProfile, InstructorProfile, GuardianStudentLink } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { auth } from "@/lib/auth";
import { logActivity, extractChanges, getIpAddress, getUserAgent } from "@/lib/admin/audit-log";
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

    // Get related data
    let profile = null;
    let guardianLinks: unknown[] = [];
    let studentLinks: unknown[] = [];

    if (user.role === "student") {
      profile = await StudentProfile.findOne({ userId: id }).lean();
      guardianLinks = await GuardianStudentLink.find({ studentId: id })
        .populate("guardianId", "name email")
        .lean();
    } else if (user.role === "instructor") {
      profile = await InstructorProfile.findOne({ userId: id }).lean();
    } else if (user.role === "parent") {
      const { ParentProfile } = await import("@/models");
      profile = await ParentProfile.findOne({ userId: id }).lean();
      studentLinks = await GuardianStudentLink.find({ guardianId: id })
        .populate("studentId", "name email studentId")
        .lean();
    }

    return apiSuccess({
      user,
      profile,
      guardianLinks,
      studentLinks,
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

    await connectDB();
    const { id } = await params;

    const user = await User.findById(id);
    if (!user) {
      return apiError(new Error("User not found"), 404);
    }

    // Store user info for logging
    const userName = user.name;
    const userEmail = user.email;

    // Delete related data
    if (user.role === "student") {
      await StudentProfile.deleteOne({ userId: id });
      await GuardianStudentLink.deleteMany({ studentId: id });
    } else if (user.role === "instructor") {
      await InstructorProfile.deleteOne({ userId: id });
    } else if (user.role === "parent") {
      await GuardianStudentLink.deleteMany({ guardianId: id });
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
