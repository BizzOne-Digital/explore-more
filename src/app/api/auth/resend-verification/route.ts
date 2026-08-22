import { NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { User } from "@/models";
import { generateVerificationCode } from "@/lib/password";
import { sendVerificationEmail } from "@/lib/auth/verification-email";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = schema.parse(body);
    await connectDB();

    const user = await User.findOne({
      email: email.toLowerCase(),
      emailVerified: false,
      isActive: true,
    });

    if (!user) {
      return NextResponse.json({ success: true, emailSent: true });
    }

    const token = generateVerificationCode();
    user.emailVerificationToken = token;
    user.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const emailResult = await sendVerificationEmail({
      name: user.name,
      email: user.email,
      token,
    });

    return NextResponse.json({
      success: true,
      emailSent: emailResult.sent,
      ...(process.env.NODE_ENV === "development" && !emailResult.sent
        ? { devVerificationCode: token, emailError: emailResult.error }
        : {}),
      ...(!emailResult.sent ? { emailError: emailResult.error } : {}),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not resend verification email" }, { status: 500 });
  }
}
