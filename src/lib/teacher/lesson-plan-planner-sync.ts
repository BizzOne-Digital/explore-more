import { TeacherPlannerEntry } from "@/models";
import { currentSchoolYear } from "@/lib/tutor/school-year";
import mongoose from "mongoose";

type PlanDoc = {
  _id: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  title: string;
  subject?: string;
  date?: Date;
  duration?: string;
};

/** Keep teacher planner in sync when a dated lesson plan is saved (Section 31). */
export async function syncLessonPlanToPlanner(plan: PlanDoc) {
  if (!plan.date) return;
  const schoolYear = currentSchoolYear();
  const dayStart = new Date(plan.date);
  dayStart.setHours(0, 0, 0, 0);

  await TeacherPlannerEntry.findOneAndUpdate(
    { teacherId: plan.teacherId, lessonPlanId: plan._id },
    {
      $set: {
        teacherId: plan.teacherId,
        schoolYear,
        lessonPlanId: plan._id,
        date: dayStart,
        title: plan.title,
        subject: plan.subject,
        entryType: "lesson",
        startTime: plan.duration?.includes(":") ? plan.duration : undefined,
      },
    },
    { upsert: true, new: true }
  );
}

export async function removePlannerBlockForLessonPlan(
  teacherId: string,
  lessonPlanId: string
) {
  if (!mongoose.Types.ObjectId.isValid(lessonPlanId)) return;
  await TeacherPlannerEntry.deleteOne({
    teacherId,
    lessonPlanId,
  });
}
