import { NextResponse } from "next/server";
import { z } from "zod";
import connectDB from "@/lib/db";
import { Program, ServiceRequest } from "@/models";
import { sendProgramBookingEmails } from "@/lib/email/program-notifications";

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

    const programDoc = await Program.findById(data.programId).lean();
    const programTitle = programDoc?.title ?? data.programSlug;

    const serviceRequest = await ServiceRequest.create({
      ...data,
      programId: data.programId,
      status: "new",
    });

    await sendProgramBookingEmails({
      booking: {
        requestId: serviceRequest._id.toString(),
        parentName: data.parentName,
        email: data.email,
        phone: data.phone,
        studentName: data.studentName,
        studentAge: data.studentAge,
        preferredSchedule: data.preferredSchedule,
        requestType: data.requestType,
        schoolStatus: data.schoolStatus,
        goals: data.goals,
        accessibilityNeeds: data.accessibilityNeeds,
        additionalNotes: data.additionalNotes,
      },
      program: {
        title: programTitle,
        slug: data.programSlug,
        schedule: programDoc?.schedule,
        ageRange: programDoc?.ageRange,
        shortDescription: programDoc?.shortDescription,
      },
    }).catch((err) => console.error("[email] program booking:", err));

    return NextResponse.json({ success: true, id: serviceRequest._id.toString() });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to submit request" }, { status: 500 });
  }
}
