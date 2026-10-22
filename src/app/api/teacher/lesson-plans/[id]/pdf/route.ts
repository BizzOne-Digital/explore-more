import connectDB from "@/lib/db";
import { jsonError } from "@/lib/api/response";
import { requireTeacherPortal } from "@/lib/teacher/api-auth";
import { getPrimarySchoolForTeacher } from "@/lib/teacher/school";
import { TeacherLessonPlan } from "@/models";
import { generateLessonPlanPdf } from "@/lib/pdf/lesson-plan-pdf";
import { DETAILED_PLAN_SECTIONS, QUICK_PLAN_SECTIONS } from "@/lib/teacher/lesson-plan-fields";
import mongoose from "mongoose";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const sessionResult = await requireTeacherPortal();
  if ("error" in sessionResult) return sessionResult.error;

  const { id } = await params;
  if (!mongoose.Types.ObjectId.isValid(id)) return jsonError("Invalid id", 400);

  await connectDB();
  const plan = await TeacherLessonPlan.findOne({
    _id: id,
    teacherId: sessionResult.user.id,
  }).lean();
  if (!plan) return jsonError("Not found", 404);

  const schoolCtx = await getPrimarySchoolForTeacher(sessionResult.user.id);
  const sections =
    plan.planMode === "detailed" ? DETAILED_PLAN_SECTIONS : QUICK_PLAN_SECTIONS;

  const pdf = await generateLessonPlanPdf({
    title: plan.title,
    schoolName: schoolCtx?.school.name,
    subject: plan.subject,
    grade: plan.grade,
    date: plan.date ? new Date(plan.date).toLocaleDateString() : undefined,
    status: plan.status,
    planMode: plan.planMode,
    sections: sections.map((s) => ({
      label: s.label,
      body: String((plan as unknown as Record<string, unknown>)[s.key] ?? ""),
    })),
  });

  const filename = `lesson-plan-${plan.title.replace(/[^\w.-]+/g, "_").slice(0, 60)}.pdf`;
  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
