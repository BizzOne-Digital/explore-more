import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLinkedStudents } from "@/lib/parent/students";
import { getAssignedTutorsByStudent } from "@/lib/parent/tutors";
import { LinkChildForm } from "@/components/parent/LinkChildForm";

export default async function ParentStudentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/parent/login?callbackUrl=/parent/students");

  const students = await getLinkedStudents(session.user.id);
  const tutorsByStudent = await getAssignedTutorsByStudent(session.user.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-explore-charcoal">My Children</h2>
          <p className="mt-1 text-explore-charcoal/70">
            Manage each linked student&apos;s courses, resources, portfolio, and records.
          </p>
        </div>
      </div>

      {students.length === 0 ? (
        <div className="space-y-6">
          <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
            <p className="text-explore-charcoal/60 mb-2">No linked students yet.</p>
            <p className="text-sm text-explore-charcoal/50">Use the form below to link a child with their Student ID.</p>
          </div>
          <LinkChildForm />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {students.map((student) => {
              const tutors = tutorsByStudent.get(student.id) ?? [];
              return (
              <div key={student.id} className="rounded-2xl bg-white p-6 shadow-sm border border-explore-charcoal/8">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-explore-teal/20 text-explore-teal font-bold text-lg">
                  {student.name.charAt(0)}
                </div>
                <h3 className="mt-4 font-display text-xl font-bold">{student.name}</h3>
                {student.studentId && (
                  <p className="text-sm font-mono text-explore-charcoal/60 mt-1">Student ID: {student.studentId}</p>
                )}
                <p className="text-sm text-explore-charcoal/60">{student.relationship}</p>
                {student.grade && <p className="text-sm text-explore-charcoal/60">Grade: {student.grade}</p>}
                {tutors.length > 0 && (
                  <p className="mt-2 text-sm text-explore-charcoal/70">
                    <span className="font-medium">Tutor{tutors.length > 1 ? "s" : ""}:</span>{" "}
                    {tutors.map((t) => t.tutorName).join(", ")}
                  </p>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href={`/parent/students/${student.id}`} className="rounded-lg bg-explore-teal px-3 py-1.5 text-xs font-semibold text-white">
                    View Student Dashboard
                  </Link>
                  <Link href="/parent/courses" className="rounded-lg bg-explore-sand px-3 py-1.5 text-xs font-semibold">
                    My Courses
                  </Link>
                  <Link href="/parent/resources" className="rounded-lg bg-explore-sand px-3 py-1.5 text-xs font-semibold">
                    My Resources
                  </Link>
                  <Link href={`/parent/portfolio?student=${student.id}`} className="rounded-lg bg-explore-teal px-3 py-1.5 text-xs font-semibold text-white">
                    Portfolio
                  </Link>
                  <Link href={`/parent/attendance?student=${student.id}`} className="rounded-lg border border-explore-charcoal/15 px-3 py-1.5 text-xs font-semibold">
                    Attendance
                  </Link>
                </div>
              </div>
              );
            })}
          </div>
          <LinkChildForm />
        </>
      )}
    </div>
  );
}
