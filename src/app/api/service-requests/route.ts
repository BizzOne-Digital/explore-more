import { NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { ServiceRequest } from "@/models";
import { queueEmail, emailTemplates } from "@/lib/services/email";

const schema = z.object({
  programId: z.string(),
  programSlug: z.string(),
  parentName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  studentName: z.string().min(2),
  studentAge: z.string().optional(),
  preferredSchedule: z.string().optional(),
  requestType: z.enum(["individual", "group"]),
  schoolStatus: z.enum(["homeschool", "traditional", "other"]).optional(),
  goals: z.string().optional(),
  accessibilityNeeds: z.string().optional(),
  additionalNotes: z.string().optional(),
  consentGiven: z.literal(true),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = schema.parse(body);
    await connectDB();

    const program = await ServiceRequest.create({
      ...data,
      programId: data.programId,
      status: "new",
    });

    const tpl = emailTemplates.serviceRequest(data.parentName, data.programSlug);
    await queueEmail({
      to: data.email,
      subject: tpl.subject,
      htmlBody: tpl.html,
      template: "serviceRequest",
    }).catch(() => {});

    return NextResponse.json({ success: true, id: program._id.toString() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
