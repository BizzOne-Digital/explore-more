import { NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { ContactMessage } from "@/models";
import { sendContactFormEmails } from "@/lib/email/contact-notifications";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().optional(),
  message: z.string().min(10),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    await connectDB();
    await ContactMessage.create(data);

    try {
      await sendContactFormEmails(data);
    } catch (err) {
      console.error("[email] contact form:", err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
