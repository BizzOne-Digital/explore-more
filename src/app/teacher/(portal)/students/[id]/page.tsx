import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { TEACHER_PORTAL_ROLES } from "@/lib/constants";
import { getRosterStudentForTeacher } from "@/lib/teacher/roster";

export const dynamic = "force-dynamic";

const LINKS = [
  { href: (id: string) => `/teacher/attendance`, label: "Attendance" },
  { href: (id: string) => `/teacher/gradebook?studentId=${id}`, label: "Gradebook" },
  { href: (id: string) => `/teacher/assessments?studentId=${id}`, label: "Assessments" },
  { href: (id: string) => `/teacher/goals?studentId=${id}`, label: "Goals" },
  { href: (id: string) => `/teacher/interventions?studentId=${id}`, label: "Interventions" },
  { href: (id: string) => `/teacher/behavior?studentId=${id}`, label: "Behavior & incidents" },
  { href: (id: string) => `/teacher/notes?studentId=${id}`, label: "Teacher notes" },
] as const;

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

  return (
    <div className="space-y-6">
      <div>
        <Link href="/teacher/students" className="text-sm text-violet-700 hover:underline">
          ← All students
        </Link>
        <h2 className="mt-2 font-display text-2xl font-bold text-explore-charcoal">
          {student.studentName}
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          {[student.grade, student.className].filter(Boolean).join(" · ")}
          {student.email ? ` · ${student.email}` : ""}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {LINKS.map((item) => (
          <Link
            key={item.label}
            href={item.href(id)}
            className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:border-violet-200"
          >
            <p className="font-semibold text-explore-charcoal">{item.label}</p>
            <p className="mt-1 text-xs text-gray-500">Open {item.label.toLowerCase()} for this student</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
