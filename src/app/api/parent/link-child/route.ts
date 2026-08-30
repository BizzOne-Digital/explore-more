import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { GuardianStudentLink, StudentProfile, User } from "@/models";
import { resolveStudentUserId } from "@/lib/students/id";

export async function POST(request: Request) {
  try {
    const sessionResult = await requireRole(["parent"]);
    if ("error" in sessionResult) return sessionResult.error;

    const { studentIdCode, dateOfBirth, relationship } = await request.json();

    if (!studentIdCode?.trim() || !relationship?.trim()) {
      return apiError(new Error("Student ID and relationship are required"), 400);
    }

    await connectDB();

    const studentUserId = await resolveStudentUserId(studentIdCode.trim());
    if (!studentUserId) {
      return apiError(new Error("Student ID not found. Check the ID from Admin → Students."), 404);
    }

    const student = await User.findOne({ _id: studentUserId, role: "student" });
    if (!student) {
      return apiError(new Error("Student account not found"), 404);
    }

    const profile = await StudentProfile.findOne({ userId: studentUserId }).select("dateOfBirth");
    if (profile?.dateOfBirth && dateOfBirth) {
      const submitted = new Date(dateOfBirth);
      const stored = new Date(profile.dateOfBirth);
      if (
        submitted.getUTCFullYear() !== stored.getUTCFullYear() ||
        submitted.getUTCMonth() !== stored.getUTCMonth() ||
        submitted.getUTCDate() !== stored.getUTCDate()
      ) {
        return apiError(new Error("Date of birth does not match our records. Contact the academy for help."), 400);
      }
    }

    const existing = await GuardianStudentLink.findOne({
      guardianId: sessionResult.user.id,
      studentId: studentUserId,
    });

    if (existing?.status === "approved") {
      return apiError(new Error("This student is already linked to your account."), 400);
    }

    const { getParentMembershipAccess } = await import("@/lib/membership/access");
    const parentAccess = await getParentMembershipAccess(sessionResult.user.id);
    const dobMatches =
      profile?.dateOfBirth &&
      dateOfBirth &&
      (() => {
        const submitted = new Date(dateOfBirth);
        const stored = new Date(profile.dateOfBirth);
        return (
          submitted.getUTCFullYear() === stored.getUTCFullYear() &&
          submitted.getUTCMonth() === stored.getUTCMonth() &&
          submitted.getUTCDate() === stored.getUTCDate()
        );
      })();

    const autoApprove = parentAccess.hasActiveMembership && (dobMatches || !profile?.dateOfBirth);

    if (existing?.status === "pending") {
      if (autoApprove) {
        existing.status = "approved";
        existing.relationship = relationship.trim();
        await existing.save();
        return apiSuccess({
          link: existing,
          message: `${student.name} has been linked to your account.`,
          status: "approved",
        });
      }
      return apiSuccess({ message: "Link request already pending staff approval.", status: "pending" });
    }

    const link = await GuardianStudentLink.create({
      guardianId: sessionResult.user.id,
      studentId: studentUserId,
      relationship: relationship.trim(),
      status: autoApprove || dobMatches ? "approved" : "pending",
      consentGiven: true,
      consentDate: new Date(),
    });

    return apiSuccess(
      {
        link,
        message:
          link.status === "approved"
            ? `${student.name} has been linked to your account.`
            : "Link request submitted. Academy staff will review and approve it shortly.",
        status: link.status,
      },
      201
    );
  } catch (error) {
    return apiError(error);
  }
}

export async function GET() {
  try {
    const sessionResult = await requireRole(["parent"]);
    if ("error" in sessionResult) return sessionResult.error;

    const { getPendingLinkRequests } = await import("@/lib/parent/students");
    const pending = await getPendingLinkRequests(sessionResult.user.id);

    return apiSuccess({ pending });
  } catch (error) {
    return apiError(error);
  }
}
