import { NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { User, StudentProfile, ParentProfile } from "@/models";
import { hashPassword, generateVerificationCode } from "@/lib/password";
import { sendVerificationEmail } from "@/lib/auth/verification-email";
import { claimPendingMembership } from "@/lib/billing/membership-activation";
import type { Role } from "@/lib/constants";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["student", "parent"]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    await connectDB();

    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    const token = generateVerificationCode();
    const passwordHash = await hashPassword(data.password);

    const user = await User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash,
      role: data.role as Role,
      emailVerified: false,
      emailVerificationToken: token,
      emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    if (data.role === "student") {
      await StudentProfile.create({ userId: user._id });
    }

    if (data.role === "parent") {
      await ParentProfile.create({
        userId: user._id,
        billingName: data.name,
        billingEmail: user.email,
      });
      await claimPendingMembership(user._id.toString(), user.email);
    }

    const emailResult = await sendVerificationEmail({
      name: data.name,
      email: data.email,
      token,
    });

    return NextResponse.json({
      success: true,
      emailSent: emailResult.sent,
      ...(process.env.NODE_ENV === "development" && !emailResult.sent
        ? { devVerificationCode: token, emailError: emailResult.error }
        : {}),
      ...(!emailResult.sent && process.env.NODE_ENV === "production"
        ? { message: "Account created, but we could not send the verification email. Use resend on the next screen." }
        : {}),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid registration data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Registration failed" }, { status: 500 });
  }
}
