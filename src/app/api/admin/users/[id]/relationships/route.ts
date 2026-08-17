import connectDB from "@/lib/db";
import { GuardianStudentLink, User } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { auth } from "@/lib/auth";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/admin/audit-log";

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

    const user = await User.findById(id);
    if (!user) {
      return apiError(new Error("User not found"), 404);
    }

    let relationships;
    if (user.role === "student") {
      relationships = await GuardianStudentLink.find({ studentId: id })
        .populate("guardianId", "name email phone")
        .populate("approvedBy", "name")
        .lean();
    } else if (user.role === "parent") {
      relationships = await GuardianStudentLink.find({ guardianId: id })
        .populate("studentId", "name email studentId")
        .populate("approvedBy", "name")
        .lean();
    } else {
      return apiSuccess([]);
    }

    return apiSuccess(relationships);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(
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

    // Validate the other user exists and has correct role
    const otherId = body.guardianId || body.studentId;
    const otherUser = await User.findById(otherId);
    if (!otherUser) {
      return apiError(new Error("Related user not found"), 404);
    }

    // Create the relationship
    const linkData = user.role === "student"
      ? {
          guardianId: body.guardianId,
          studentId: id,
          relationship: body.relationship,
          status: body.status || "approved",
          consentGiven: body.consentGiven ?? true,
          consentDate: new Date(),
          approvedBy: session.user.id,
        }
      : {
          guardianId: id,
          studentId: body.studentId,
          relationship: body.relationship,
          status: body.status || "approved",
          consentGiven: body.consentGiven ?? true,
          consentDate: new Date(),
          approvedBy: session.user.id,
        };

    const link = await GuardianStudentLink.create(linkData);

    // Log the activity
    await logActivity({
      performedBy: session.user.id,
      action: "create",
      entity: "guardian_student_link",
      entityId: link._id.toString(),
      userId: id,
      details: `Created relationship: ${user.name} <-> ${otherUser.name} (${body.relationship})`,
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return apiSuccess(link, 201);
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
    const { searchParams } = new URL(request.url);
    const linkId = searchParams.get("linkId");

    if (!linkId) {
      return apiError(new Error("linkId is required"), 400);
    }

    const link = await GuardianStudentLink.findById(linkId)
      .populate("guardianId", "name")
      .populate("studentId", "name");

    if (!link) {
      return apiError(new Error("Relationship not found"), 404);
    }

    await GuardianStudentLink.findByIdAndDelete(linkId);

    // Log the activity
    const guardian = link.guardianId as unknown as { name?: string };
    const student = link.studentId as unknown as { name?: string };
    await logActivity({
      performedBy: session.user.id,
      action: "delete",
      entity: "guardian_student_link",
      entityId: linkId,
      userId: id,
      details: `Removed relationship: ${guardian.name ?? "?"} <-> ${student.name ?? "?"}`,
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
