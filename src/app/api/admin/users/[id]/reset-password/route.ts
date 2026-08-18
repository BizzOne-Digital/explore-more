import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { User } from "@/models";
import { sendTransactionalEmail } from "@/lib/services/email";
import { apiSuccess, apiError, isValidObjectId } from "@/lib/admin/api";
import { logActivity, getIpAddress, getUserAgent } from "@/lib/admin/audit-log";
import crypto from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "administrator") {
      return apiError(new Error("Unauthorized"), 401);
    }

    const { id } = await params;
    if (!isValidObjectId(id)) return apiError(new Error("Invalid user id"), 400);

    await connectDB();

    const user = await User.findById(id);
    if (!user) {
      return apiError(new Error("User not found"), 404);
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000);

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3004"}/reset-password?token=${resetToken}`;

    const emailResult = await sendTransactionalEmail({
      to: user.email,
      subject: "Password Reset Request - Explore More Academy",
      htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #0c8991; padding: 20px; border-radius: 8px 8px 0 0;">
            <h2 style="color: white; margin: 0;">Password Reset Request</h2>
          </div>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 0 0 8px 8px;">
            <p>Hello ${user.name},</p>
            <p>An administrator has initiated a password reset for your Explore More Academy account.</p>
            <p>Click the button below to reset your password:</p>
            <div style="margin: 30px 0; text-align: center;">
              <a href="${resetUrl}" style="background: #0c8991; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Or copy and paste this link in your browser:<br>
              <a href="${resetUrl}" style="color: #0c8991; word-break: break-all;">${resetUrl}</a>
            </p>
          </div>
        </div>
      `,
      template: "password-reset",
    });

    const admin = await User.findById(session.user.id).select("name").lean();

    await logActivity({
      performedBy: session.user.id,
      action: "password_reset",
      entity: "user",
      entityId: id,
      userId: id,
      details: `${admin?.name ?? "Administrator"} sent password reset instructions to ${user.email}`,
      ipAddress: getIpAddress(request),
      userAgent: getUserAgent(request),
    });

    const message = emailResult.sent
      ? `Password reset email sent to ${user.email}`
      : `Password reset link created for ${user.email}. Email delivery is pending (SMTP may not be configured).`;

    return apiSuccess({ message, emailSent: emailResult.sent });
  } catch (error) {
    console.error("Password reset error:", error);
    return apiError(error);
  }
}
