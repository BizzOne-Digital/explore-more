import connectDB from "@/lib/db";
import { User, StudentProfile, InstructorProfile } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { auth } from "@/lib/auth";
import { logActivity, extractChanges, getIpAddress, getUserAgent } from "@/lib/admin/audit-log";

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

    const user = await User.findById(id);
    if (!user) {
      return apiError(new Error("User not found"), 404);
    }

    let profile;
    let currentProfile;

    if (user.role === "student") {
      currentProfile = await StudentProfile.findOne({ userId: id }).lean();
      
      profile = await StudentProfile.findOneAndUpdate(
        { userId: id },
        {
          dateOfBirth: body.dateOfBirth,
          ageRange: body.ageRange,
          schoolStatus: body.schoolStatus,
          bio: body.bio,
          emergencyContact: body.emergencyContact,
        },
        { new: true, upsert: true, runValidators: true }
      );
    } else if (user.role === "instructor") {
      currentProfile = await InstructorProfile.findOne({ userId: id }).lean();
      
      profile = await InstructorProfile.findOneAndUpdate(
        { userId: id },
        {
          title: body.title,
          bio: body.bio,
          specialties: body.specialties,
          isPublished: body.isPublished,
        },
        { new: true, upsert: true, runValidators: true }
      );
    } else {
      return apiError(new Error("Profile not supported for this role"), 400);
    }

    // Extract changes for audit log
    const changes = currentProfile
      ? extractChanges(
          currentProfile as unknown as Record<string, unknown>,
          profile.toObject() as unknown as Record<string, unknown>,
          ["__v", "updatedAt", "_id", "userId"]
        )
      : { profile: { old: null, new: "created" } };

    // Log the activity
    await logActivity({
      performedBy: session.user.id,
      action: currentProfile ? "update" : "create",
      entity: user.role === "student" ? "student_profile" : "instructor_profile",
      entityId: profile._id.toString(),
      userId: id,
      changes,
      details: `Updated ${user.role} profile for: ${user.name}`,
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return apiSuccess(profile);
  } catch (error) {
    return apiError(error);
  }
}
