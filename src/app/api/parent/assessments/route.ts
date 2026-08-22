import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { getAssessmentsForParent } from "@/lib/assessments/queries";
import { Assessment, AssessmentSubmission, GuardianStudentLink } from "@/models";
import { z } from "zod";
import { isValidObjectId } from "@/lib/admin/api";

const submitSchema = z.object({
  assessmentId: z.string().min(1),
  studentId: z.string().min(1),
  filePath: z.string().min(1),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "parent") {
      return apiError(new Error("Unauthorized"), 401);
    }

    const items = await getAssessmentsForParent(session.user.id);
    return apiSuccess(items);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "parent") {
      return apiError(new Error("Unauthorized"), 401);
    }

    await connectDB();
    const body = await request.json();
    const data = submitSchema.parse(body);

    if (!isValidObjectId(data.assessmentId) || !isValidObjectId(data.studentId)) {
      return apiError(new Error("Invalid IDs"), 400);
    }

    const link = await GuardianStudentLink.findOne({
      guardianId: session.user.id,
      studentId: data.studentId,
      status: "approved",
    }).lean();

    if (!link) {
      return apiError(new Error("You are not linked to this student"), 403);
    }

    const assessment = await Assessment.findById(data.assessmentId).lean();
    if (!assessment) {
      return apiError(new Error("Assessment not found"), 404);
    }

    const submission = await AssessmentSubmission.findOneAndUpdate(
      { assessmentId: data.assessmentId, studentId: data.studentId },
      {
        parentId: session.user.id,
        filePath: data.filePath,
        submittedAt: new Date(),
        letterGrade: undefined,
        published: false,
        publishedAt: undefined,
        gradedBy: undefined,
        gradedAt: undefined,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return apiSuccess({ submission }, 201);
  } catch (error) {
    return apiError(error);
  }
}
