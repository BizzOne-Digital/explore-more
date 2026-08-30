import Link from "next/link";
import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TUTOR_PORTAL_ROLES } from "@/lib/constants";
import { listTutorStudents } from "@/lib/tutor/queries";

export const dynamic = "force-dynamic";

export default async function TutorStudentsPage() {
  const session = await auth();
  if (!session?.user || !TUTOR_PORTAL_ROLES.includes(session.user.role as (typeof TUTOR_PORTAL_ROLES)[number])) {
    redirect("/tutor/login");
  }

  await connectDB();
  const students = await listTutorStudents(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">My Students</h2>
        <p className="mt-1 text-sm text-gray-500">
          Students assigned to you by Explore More Academy administration.
        </p>
      </div>

      {students.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
          <p className="text-gray-500">No students assigned yet.</p>
          <p className="mt-2 text-sm text-gray-400">
            Contact administration to assign students using your Staff ID.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {students.map((student) => (
            <Link
              key={student.studentId}
              href={`/tutor/students/${student.studentId}`}
              className="rounded-2xl bg-white p-5 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-explore-charcoal">{student.studentName}</h3>
                  {student.studentNumber && (
                    <p className="text-sm font-mono text-explore-teal">{student.studentNumber}</p>
                  )}
                  {student.grade && <p className="text-sm text-gray-500">Grade {student.grade}</p>}
                </div>
                <div className="text-right text-sm text-gray-500">
                  {student.subjects.length > 0 && (
                    <p>{student.subjects.join(", ")}</p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
