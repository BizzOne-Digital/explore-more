import connectDB from "@/lib/db";
import { AssessmentSubmission } from "@/models";
import { apiSuccess, apiError, notFound, isValidObjectId } from "@/lib/admin/api";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { publishAssessmentGrade } from "@/lib/assessments/publish";
import { isLetterGrade } from "@/lib/assessments/constants";

const gradeSchema = z.object({
  letterGrade: z.string().min(1),
  publish: z.boolean().optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(new Error("Unauthorized"), 401);
    }

    const { id } = await params;
    if (!isValidObjectId(id)) return notFound();

    await connectDB();
    const body = await request.json();
    const data = gradeSchema.parse(body);

    if (!isLetterGrade(data.letterGrade)) {
      return apiError(new Error("Invalid letter grade"), 400);
    }

    const submission = await AssessmentSubmission.findById(id).lean();
    if (!submission) return notFound();

    if (data.publish) {
      const result = await publishAssessmentGrade(id, data.letterGrade, session.user.id);
      const updated = await AssessmentSubmission.findById(id).lean();
      return apiSuccess({ submission: updated, publish: result });
    }

    const updated = await AssessmentSubmission.findByIdAndUpdate(
      id,
      {
        letterGrade: data.letterGrade,
        gradedBy: session.user.id,
        gradedAt: new Date(),
      },
      { new: true }
    ).lean();

    return apiSuccess({ submission: updated });
  } catch (error) {
    return apiError(error);
  }
}
