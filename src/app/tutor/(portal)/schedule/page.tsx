import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TUTOR_PORTAL_ROLES } from "@/lib/constants";
import { listTutorStudents } from "@/lib/tutor/queries";

export const dynamic = "force-dynamic";

export default async function TutorSchedulePage() {
  const session = await auth();
  if (!session?.user || !TUTOR_PORTAL_ROLES.includes(session.user.role as (typeof TUTOR_PORTAL_ROLES)[number])) {
    redirect("/tutor/login");
  }

  await connectDB();
  const students = await listTutorStudents(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">My Schedule</h2>
        <p className="mt-1 text-sm text-gray-500">
          Tutoring schedules recorded for your assigned students.
        </p>
      </div>

      {students.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
          No schedules yet — assignments will appear here once students are linked to you.
        </div>
      ) : (
        <div className="grid gap-4">
          {students.map((s) => (
            <article key={s.studentId} className="rounded-2xl bg-white p-5 shadow-sm">
              <h3 className="font-semibold">{s.studentName}</h3>
              {s.subjects.length > 0 && (
                <p className="text-sm text-gray-500">{s.subjects.join(", ")}</p>
              )}
              <p className="mt-3 whitespace-pre-wrap text-sm text-gray-600">
                {s.scheduleNotes || "No schedule notes on file. Update via student profile or ask administration."}
              </p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
