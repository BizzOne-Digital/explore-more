import { TeacherStudentSchedulesClient } from "@/components/teacher/TeacherStudentSchedulesClient";

export const dynamic = "force-dynamic";

export default function TeacherStudentSchedulesPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-explore-charcoal">Student Schedules</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Add subject, date, and time blocks per student. They appear on Calendar with your teacher
          planner entries.
        </p>
      </div>
      <TeacherStudentSchedulesClient />
    </div>
  );
}
