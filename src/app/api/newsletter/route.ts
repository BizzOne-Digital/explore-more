import { NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { NewsletterSubscriber } from "@/models";
import { generateToken } from "@/lib/password";

const schema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    await connectDB();

    const existing = await NewsletterSubscriber.findOne({ email: data.email.toLowerCase() });
    if (existing && !existing.unsubscribed) {
      return NextResponse.json({ success: true, message: "Already subscribed" });
    }

    await NewsletterSubscriber.findOneAndUpdate(
      { email: data.email.toLowerCase() },
      {
        email: data.email.toLowerCase(),
        name: data.name,
        verified: false,
        verificationToken: generateToken(),
        unsubscribed: false,
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}
