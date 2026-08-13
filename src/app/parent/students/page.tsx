import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLinkedStudents } from "@/lib/parent/students";

export default async function ParentStudentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/parent/students");

  const students = await getLinkedStudents(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-explore-charcoal">My Students</h2>
        <p className="mt-1 text-explore-charcoal/70">View academic records, enrollments, and homeschool portfolios.</p>
      </div>

      {students.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-explore-charcoal/60">No linked students yet.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {students.map((student) => (
            <div key={student.id} className="rounded-2xl bg-white p-6 shadow-sm border border-explore-charcoal/8">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-explore-teal/20 text-explore-teal font-bold text-lg">
                {student.name.charAt(0)}
              </div>
              <h3 className="mt-4 font-display text-xl font-bold">{student.name}</h3>
              <p className="text-sm text-explore-charcoal/60">{student.relationship}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/parent/students/${student.id}`} className="rounded-lg bg-explore-sand px-3 py-1.5 text-xs font-semibold">
                  Academic Records
                </Link>
                <Link href={`/parent/portfolio?student=${student.id}`} className="rounded-lg bg-explore-teal px-3 py-1.5 text-xs font-semibold text-white">
                  Homeschool Portfolio
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
