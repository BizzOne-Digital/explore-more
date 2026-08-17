import connectDB from "@/lib/db";
import { User, GuardianStudentLink } from "@/models";
import { apiSuccess, apiError, notFound, isValidObjectId } from "@/lib/admin/api";
import crypto from "crypto";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return notFound();
    
    await connectDB();
    
    // Find the student
    const student = await User.findOne({ _id: id, role: "student" }).lean();
    if (!student) return notFound();
    
    // Find approved guardian link
    const guardianLink = await GuardianStudentLink.findOne({
      studentId: id,
      status: "approved",
    }).populate("guardianId").lean();
    
    if (!guardianLink || !guardianLink.guardianId) {
      return apiError("No parent/guardian account is linked to this student.");
    }
    
    const guardian = guardianLink.guardianId as unknown as { _id: string; name?: string; email?: string };
    
    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour
    
    await User.findByIdAndUpdate(guardian._id, {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    });
    
    // TODO: Send email with reset link
    // For now, we'll just log it
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`;
    console.log("Password reset link:", resetLink);
    console.log("Send to:", guardian.email);
    
    // In production, integrate with email service:
    // await sendPasswordResetEmail({
    //   to: guardian.email,
    //   studentName: student.name,
    //   resetLink,
    // });
    
    return apiSuccess({ 
      sent: true,
      message: `Password reset link sent to ${guardian.email}`,
    });
  } catch (error) {
    return apiError(error);
  }
}
