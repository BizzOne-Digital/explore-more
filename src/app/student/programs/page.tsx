import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getStudentGrade, getPublishedProgramsForGrade } from "@/lib/grades/queries";
import { formatGradeLabel } from "@/lib/grades";

export default async function StudentProgramsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/student/programs");

  await connectDB();
  const studentGrade = await getStudentGrade(session.user.id);
  const programs = studentGrade ? await getPublishedProgramsForGrade(studentGrade) : [];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-explore-charcoal">Programs</h2>
        <p className="mt-1 text-explore-charcoal/70">
          {studentGrade
            ? `Programs available for ${formatGradeLabel(studentGrade)}`
            : "Set your grade in your profile to see available programs."}
        </p>
      </div>

      {programs.length === 0 ? (
        <div className="rounded-2xl bg-explore-white p-8 text-center shadow-sm">
          <p className="text-explore-charcoal/60">
            {studentGrade ? "No programs available for your grade yet." : "Grade not set on your profile."}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {programs.map((program) => (
            <Link
              key={program._id.toString()}
              href={`/programs/${program.slug}`}
              className="rounded-2xl border border-explore-sand bg-explore-white p-5 shadow-sm transition hover:border-explore-teal/40"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-explore-teal">
                {program.tagline}
              </p>
              <h3 className="mt-2 font-display text-lg text-explore-charcoal">{program.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm text-explore-charcoal/60">
                {program.shortDescription}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
