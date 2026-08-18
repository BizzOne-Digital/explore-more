import connectDB from "@/lib/db";
import { requireRole } from "@/lib/api/auth-helpers";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { GuardianStudentLink, User } from "@/models";
import { resolveStudentUserId } from "@/lib/students/id";
import mongoose from "mongoose";

export async function GET() {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    await connectDB();
    const links = await GuardianStudentLink.find()
      .populate("guardianId", "name email")
      .populate("studentId", "name email studentId")
      .sort({ createdAt: -1 });

    return apiSuccess(links);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    const { guardianId, studentId, relationship, status } = await request.json();
    if (!guardianId || !studentId || !relationship) {
      return apiError(new Error("guardianId, studentId, and relationship are required"), 400);
    }

    await connectDB();

    if (!mongoose.Types.ObjectId.isValid(guardianId)) {
      return apiError(new Error("Invalid guardian ID"), 400);
    }

    const guardian = await User.findOne({ _id: guardianId, role: "parent" });
    if (!guardian) {
      return apiError(new Error("Parent/guardian account not found"), 404);
    }

    const studentUserId = await resolveStudentUserId(studentId);
    if (!studentUserId) {
      return apiError(
        new Error("Student not found. Use the Student ID from Admin → Students (e.g. STU-…)."),
        404
      );
    }

    const link = await GuardianStudentLink.findOneAndUpdate(
      { guardianId, studentId: studentUserId },
      {
        guardianId,
        studentId: studentUserId,
        relationship,
        status: status ?? "approved",
        consentGiven: true,
        consentDate: new Date(),
        approvedBy: sessionResult.user.id,
      },
      { upsert: true, new: true }
    )
      .populate("guardianId", "name email")
      .populate("studentId", "name email studentId");

    return apiSuccess(link, 201);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    const { linkId, status } = await request.json();
    if (!linkId || !status) return apiError(new Error("linkId and status are required"), 400);

    await connectDB();
    const link = await GuardianStudentLink.findByIdAndUpdate(
      linkId,
      { status, approvedBy: sessionResult.user.id },
      { new: true }
    )
      .populate("guardianId", "name email")
      .populate("studentId", "name email studentId");
    if (!link) return apiError(new Error("Link not found"), 404);

    return apiSuccess(link);
  } catch (error) {
    return apiError(error);
  }
}
