import { z } from "zod";
import connectDB from "@/lib/db";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { requireRole } from "@/lib/api/auth-helpers";
import { findTutorByTutorId } from "@/lib/tutor/tutor-id";
import { TutorStudentAssignment, User } from "@/models";

const assignSchema = z.object({
  tutorId: z.string().min(1),
  studentId: z.string().min(1),
  subjects: z.array(z.string()).optional(),
  scheduleNotes: z.string().optional(),
  learningGoals: z.string().optional(),
});

export async function GET(request: Request) {
  const sessionResult = await requireRole(["administrator"]);
  if ("error" in sessionResult) return sessionResult.error;

  const { searchParams } = new URL(request.url);
  const studentId = searchParams.get("studentId");
  const tutorUserId = searchParams.get("tutorUserId");

  await connectDB();

  const filter: Record<string, unknown> = {};
  if (studentId) filter.studentId = studentId;
  if (tutorUserId) filter.tutorId = tutorUserId;

  const assignments = await TutorStudentAssignment.find(filter)
    .populate("tutorId", "name email tutorId")
    .populate("studentId", "name email studentId")
    .sort({ updatedAt: -1 })
    .lean();

  return apiSuccess({ assignments });
}

export async function POST(request: Request) {
  const sessionResult = await requireRole(["administrator"]);
  if ("error" in sessionResult) return sessionResult.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError(new Error("Invalid JSON"), 400);
  }

  const parsed = assignSchema.safeParse(body);
  if (!parsed.success) return apiError(new Error("Invalid assignment data"), 400);

  await connectDB();

  const tutor = await findTutorByTutorId(parsed.data.tutorId);
  if (!tutor) return apiError(new Error("Tutor ID not found"), 404);

  const student = await User.findOne({ _id: parsed.data.studentId, role: "student" });
  if (!student) return apiError(new Error("Student not found"), 404);

  const assignment = await TutorStudentAssignment.findOneAndUpdate(
    { tutorId: tutor._id, studentId: student._id },
    {
      tutorId: tutor._id,
      studentId: student._id,
      subjects: parsed.data.subjects ?? [],
      scheduleNotes: parsed.data.scheduleNotes,
      learningGoals: parsed.data.learningGoals,
      status: "active",
      assignedBy: sessionResult.user.id,
      assignedAt: new Date(),
    },
    { upsert: true, new: true }
  );

  return apiSuccess({ assignment }, 201);
}

export async function DELETE(request: Request) {
  const sessionResult = await requireRole(["administrator"]);
  if ("error" in sessionResult) return sessionResult.error;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return apiError(new Error("Assignment id required"), 400);

  await connectDB();
  await TutorStudentAssignment.findByIdAndUpdate(id, { status: "ended" });
  return apiSuccess({ success: true });
}
