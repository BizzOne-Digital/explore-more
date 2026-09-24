import connectDB from "@/lib/db";
import {
  TeacherClassAttendance,
  TeacherEndOfDayLog,
  TeacherLessonPlan,
  TeacherPlannerEntry,
  TeacherTodo,
} from "@/models";
import { currentSchoolYear } from "@/lib/tutor/school-year";

export async function getTeacherWorkspaceDashboardStats(teacherId: string) {
  await connectDB();
  const schoolYear = currentSchoolYear();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const [openTodos, todayPlanner, lessonPlansThisWeek, attendanceToday, checkedOutToday] =
    await Promise.all([
      TeacherTodo.countDocuments({ teacherId, status: "open" }),
      TeacherPlannerEntry.countDocuments({
        teacherId,
        schoolYear,
        date: { $gte: todayStart, $lt: todayEnd },
      }),
      TeacherLessonPlan.countDocuments({
        teacherId,
        schoolYear,
        date: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      }),
      TeacherClassAttendance.countDocuments({
        teacherId,
        date: { $gte: todayStart, $lt: todayEnd },
      }),
      TeacherEndOfDayLog.countDocuments({
        teacherId,
        logDate: { $gte: todayStart, $lt: todayEnd },
      }),
    ]);

  return {
    openTodos,
    todayPlanner,
    lessonPlansThisWeek,
    attendanceToday,
    checkedOutToday,
  };
}
