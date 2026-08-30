import connectDB from "@/lib/db";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireTutorPortal } from "@/lib/tutor/api-auth";
import { getTutorStudentDetail } from "@/lib/tutor/queries";
import { TutorStudentAssignment } from "@/models";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionResult = await requireTutorPortal();
  if ("error" in sessionResult) return sessionResult.error;

  const { id } = await params;
  await connectDB();

  const detail = await getTutorStudentDetail(sessionResult.user.id, id);
  if (!detail) return jsonError("Student not found or not assigned to you", 404);

  return jsonOk(detail);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionResult = await requireTutorPortal();
  if ("error" in sessionResult) return sessionResult.error;

  const { id: studentId } = await params;
  const body = await request.json();

  await connectDB();
  const assignment = await TutorStudentAssignment.findOne({
    tutorId: sessionResult.user.id,
    studentId,
    status: "active",
  });

  if (!assignment) return jsonError("Student not assigned to you", 404);

  if (body.tutorNotes !== undefined) assignment.tutorNotes = String(body.tutorNotes);
  if (body.learningGoals !== undefined) assignment.learningGoals = String(body.learningGoals);
  if (body.scheduleNotes !== undefined) assignment.scheduleNotes = String(body.scheduleNotes);
  if (Array.isArray(body.subjects)) assignment.subjects = body.subjects.map(String);

  await assignment.save();
  return jsonOk({ success: true });
}
