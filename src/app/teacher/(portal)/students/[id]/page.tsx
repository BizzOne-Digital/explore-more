import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { TEACHER_PORTAL_ROLES } from "@/lib/constants";
import { getRosterStudentForTeacher } from "@/lib/teacher/roster";
import { getStudentSyncHub } from "@/lib/teacher/student-sync-hub";
import { TeacherStudentProfileClient } from "@/components/teacher/TeacherStudentProfileClient";

export const dynamic = "force-dynamic";

export default async function TeacherStudentProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (
    !session?.user ||
    !TEACHER_PORTAL_ROLES.includes(session.user.role as (typeof TEACHER_PORTAL_ROLES)[number])
  ) {
    redirect("/tutor/login");
  }

  const { id } = await params;
  const student = await getRosterStudentForTeacher(session.user.id, id);
  if (!student) notFound();

  const hub = await getStudentSyncHub(session.user.id, id);

  const hubSummary = hub ? (
    <section className="rounded-2xl bg-white p-5 shadow-sm text-sm space-y-3">
      <h3 className="font-semibold text-explore-charcoal">Synced overview</h3>
      <p className="text-gray-600">
        {hub.gradeEntries.length} grade entries · {hub.assessments.length} assessments ·{" "}
        {hub.attendanceRecent.length} attendance marks (30 days) ·{" "}
        {hub.scheduleBlocks.length} upcoming schedule blocks
      </p>
      {Object.keys(hub.records).length > 0 && (
        <p className="text-gray-500">
          Records:{" "}
          {Object.entries(hub.records)
            .map(([k, v]) => `${k} (${v})`)
            .join(", ")}
        </p>
      )}
    </section>
  ) : null;

  return (
    <TeacherStudentProfileClient
      studentId={id}
      studentName={student.studentName}
      grade={student.grade}
      className={student.className}
      email={student.email}
      hubSummary={hubSummary}
    />
  );
}
