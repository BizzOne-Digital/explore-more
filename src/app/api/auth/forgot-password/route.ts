import { NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { User } from "@/models";
import { generateToken } from "@/lib/password";
import { sendTransactionalEmail, emailTemplates } from "@/lib/services/email";
import { getAppUrl } from "@/lib/services/stripe";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = schema.parse(body);
    await connectDB();

    const user = await User.findOne({ email: email.toLowerCase(), isActive: true });
    if (!user) {
      return NextResponse.json({ success: true });
    }

    const token = generateToken();
    user.passwordResetToken = token;
    user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000);
    await user.save();

    const resetUrl = `${getAppUrl()}/reset-password?token=${token}`;
    const tpl = emailTemplates.passwordReset(user.name, resetUrl);
    await sendTransactionalEmail({
      to: user.email,
      subject: tpl.subject,
      htmlBody: tpl.html,
      template: "passwordReset",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    return NextResponse.json({ error: "Request failed" }, { status: 500 });
  }
}
