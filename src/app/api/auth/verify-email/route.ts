import { NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { User } from "@/models";

const schema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, token } = schema.parse(body);
    await connectDB();

    const user = await User.findOne({
      email: email.toLowerCase(),
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 });
    }

    user.emailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    if (user.role === "parent") {
      const { claimPendingMembership } = await import("@/lib/billing/membership-activation");
      await claimPendingMembership(user._id.toString(), user.email);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
