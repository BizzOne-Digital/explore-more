import connectDB from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api/response";
import { TeacherLessonPlan } from "@/models";
import { DETAILED_PLAN_SECTIONS, QUICK_PLAN_SECTIONS } from "@/lib/teacher/lesson-plan-fields";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const { token } = await params;
  if (!token || token.length < 16) return jsonError("Not found", 404);

  await connectDB();
  const plan = await TeacherLessonPlan.findOne({
    shareToken: token,
    shareEnabled: true,
    archived: { $ne: true },
  })
    .select(
      "title subject grade date status planMode learningObjective essentialQuestion materials warmUp instruction assessment homework differentiation reflection notes"
    )
    .lean();

  if (!plan) return jsonError("Not found", 404);

  const sections =
    plan.planMode === "detailed" ? DETAILED_PLAN_SECTIONS : QUICK_PLAN_SECTIONS;

  return jsonOk({
    plan: {
      title: plan.title,
      subject: plan.subject,
      grade: plan.grade,
      date: plan.date,
      status: plan.status,
      planMode: plan.planMode,
      sections: sections.map((s) => ({
        label: s.label,
        body: String((plan as unknown as Record<string, unknown>)[s.key] ?? ""),
      })),
    },
  });
}
