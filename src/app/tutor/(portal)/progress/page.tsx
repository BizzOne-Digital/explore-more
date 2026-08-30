import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TUTOR_PORTAL_ROLES } from "@/lib/constants";
import { TutorSession } from "@/models";

export const dynamic = "force-dynamic";

export default async function TutorProgressPage() {
  const session = await auth();
  if (!session?.user || !TUTOR_PORTAL_ROLES.includes(session.user.role as (typeof TUTOR_PORTAL_ROLES)[number])) {
    redirect("/tutor/login");
  }

  await connectDB();
  const sessions = await TutorSession.find({ tutorId: session.user.id })
    .populate("studentId", "name studentId")
    .sort({ sessionDate: -1 })
    .limit(50)
    .lean();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Progress Reports</h2>
        <p className="mt-1 text-sm text-gray-500">
          Session history and progress notes from completed tutoring sessions.
        </p>
      </div>

      {sessions.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-gray-500 shadow-sm">
          Complete a session from a student profile to build their progress history.
        </div>
      ) : (
        <ul className="space-y-4">
          {sessions.map((s) => {
            const student = s.studentId as unknown as { name?: string; studentId?: string };
            return (
              <li key={s._id.toString()} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap justify-between gap-2">
                  <p className="font-semibold">{student?.name ?? "Student"}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(s.sessionDate).toLocaleDateString()}
                  </p>
                </div>
                <p className="mt-1 text-sm font-medium text-violet-700">{s.subject}</p>
                {s.topicCovered && <p className="mt-2 text-sm text-gray-600">{s.topicCovered}</p>}
                {s.studentProgress && (
                  <p className="mt-2 text-sm">
                    <strong>Progress:</strong> {s.studentProgress}
                  </p>
                )}
                {s.areasNeedingPractice && (
                  <p className="mt-1 text-sm text-gray-500">
                    <strong>Practice:</strong> {s.areasNeedingPractice}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
