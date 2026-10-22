import connectDB from "@/lib/db";
import { TeacherLessonPlan } from "@/models";
import { currentSchoolYear } from "@/lib/tutor/school-year";

export async function getTeacherLessonPlanStats(teacherId: string) {
  await connectDB();
  const schoolYear = currentSchoolYear();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);

  const base = { teacherId, schoolYear, archived: { $ne: true }, isTemplate: { $ne: true } };

  const [total, thisWeek, drafts, completed, recent] = await Promise.all([
    TeacherLessonPlan.countDocuments(base),
    TeacherLessonPlan.countDocuments({
      ...base,
      date: { $gte: weekStart },
    }),
    TeacherLessonPlan.countDocuments({ ...base, status: "draft" }),
    TeacherLessonPlan.countDocuments({
      ...base,
      status: { $in: ["completed", "taught"] },
    }),
    TeacherLessonPlan.find(base)
      .sort({ updatedAt: -1 })
      .limit(8)
      .select("title subject grade date status planMode updatedAt")
      .lean(),
  ]);

  return { total, thisWeek, drafts, completed, recent };
}
