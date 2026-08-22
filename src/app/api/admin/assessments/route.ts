import connectDB from "@/lib/db";
import { Assessment } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { auth } from "@/lib/auth";
import { z } from "zod";
import { isGradeLevel } from "@/lib/grades";
import { notifyParentsOfNewAssessment } from "@/lib/assessments/notify";

const createSchema = z.object({
  title: z.string().min(1),
  grade: z.string().min(1),
  filePath: z.string().min(1),
});

export async function GET(request: Request) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const grade = searchParams.get("grade");

    const filter = grade && isGradeLevel(grade) ? { grade } : {};
    const items = await Assessment.find(filter).sort({ createdAt: -1 }).lean();
    return apiSuccess(items);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return apiError(new Error("Unauthorized"), 401);
    }

    await connectDB();
    const body = await request.json();
    const data = createSchema.parse(body);

    if (!isGradeLevel(data.grade)) {
      return apiError(new Error("Invalid grade"), 400);
    }

    const assessment = await Assessment.create({
      title: data.title.trim(),
      grade: data.grade,
      filePath: data.filePath,
      createdBy: session.user.id,
    });

    const notify = await notifyParentsOfNewAssessment(
      assessment.title,
      data.grade,
      session.user.id
    );

    await Assessment.findByIdAndUpdate(assessment._id, { notifiedAt: new Date() });

    return apiSuccess({ assessment, notify }, 201);
  } catch (error) {
    return apiError(error);
  }
}
