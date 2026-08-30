import { z } from "zod";
import connectDB from "@/lib/db";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireTutorPortal } from "@/lib/tutor/api-auth";
import { tutorHasStudentAccess } from "@/lib/tutor/permissions";
import { TutorSession } from "@/models";

const sessionSchema = z.object({
  studentId: z.string().min(1),
  sessionDate: z.string().min(1),
  subject: z.string().min(1),
  topicCovered: z.string().optional(),
  workedOn: z.string().optional(),
  studentProgress: z.string().optional(),
  areasNeedingPractice: z.string().optional(),
  homeworkAssigned: z.string().optional(),
  privateStaffNotes: z.string().optional(),
});

export async function GET(request: Request) {
  const sessionResult = await requireTutorPortal();
  if ("error" in sessionResult) return sessionResult.error;

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");

  await connectDB();
  const filter: Record<string, unknown> = { tutorId: sessionResult.user.id };
  if (studentId) {
    if (!(await tutorHasStudentAccess(sessionResult.user.id, studentId))) {
      return jsonError("Student not assigned to you", 403);
    }
    filter.studentId = studentId;
  }

  const sessions = await TutorSession.find(filter).sort({ sessionDate: -1 }).limit(50).lean();
  return jsonOk({ sessions });
}

export async function POST(request: Request) {
  const sessionResult = await requireTutorPortal();
  if ("error" in sessionResult) return sessionResult.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = sessionSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid session data", 400);

  if (!(await tutorHasStudentAccess(sessionResult.user.id, parsed.data.studentId))) {
    return jsonError("Student not assigned to you", 403);
  }

  await connectDB();
  const session = await TutorSession.create({
    tutorId: sessionResult.user.id,
    studentId: parsed.data.studentId,
    sessionDate: new Date(parsed.data.sessionDate),
    subject: parsed.data.subject,
    topicCovered: parsed.data.topicCovered,
    workedOn: parsed.data.workedOn,
    studentProgress: parsed.data.studentProgress,
    areasNeedingPractice: parsed.data.areasNeedingPractice,
    homeworkAssigned: parsed.data.homeworkAssigned,
    privateStaffNotes: parsed.data.privateStaffNotes,
  });

  return jsonOk({ session }, 201);
}
