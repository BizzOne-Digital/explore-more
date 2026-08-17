import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import connectDB from "@/lib/db";
import { User } from "@/models";
import { sendTransactionalEmail } from "@/lib/services/email";
import crypto from "crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "administrator") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    await connectDB();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Generate password reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.passwordResetToken = resetToken;
    user.passwordResetExpires = resetExpires;
    await user.save();

    // Send password reset email
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3004'}/reset-password?token=${resetToken}`;

    await sendTransactionalEmail({
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
              <a href="${resetUrl}" 
                 style="background: #0c8991; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
                Reset Password
              </a>
            </div>

            <p style="color: #666; font-size: 14px;">
              Or copy and paste this link in your browser:<br>
              <a href="${resetUrl}" style="color: #0c8991; word-break: break-all;">${resetUrl}</a>
            </p>

            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #856404;">
                <strong>⚠️ Security Notice:</strong><br>
                This link will expire in 1 hour. If you didn't request this, please contact us immediately.
              </p>
            </div>

            <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 15px;">
              This email was sent by an administrator. If you have questions, contact us at ${process.env.ADMIN_EMAIL || 'chris@exploremoreacademy.com'}
            </p>
          </div>
        </div>
      `,
      template: "password-reset",
    });

    return NextResponse.json({
      success: true,
      message: `Password reset email sent to ${user.email}`,
    });
  } catch (error) {
    console.error("Password reset error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to send password reset" },
      { status: 500 }
    );
  }
}
