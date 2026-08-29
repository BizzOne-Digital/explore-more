import Link from "next/link";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getParentCourseEnrollments } from "@/lib/parent/learning";

export default async function ParentCoursesPage() {
  const session = await auth();
  if (!session?.user) redirect("/parent/login?callbackUrl=/parent/courses");

  const enrollments = await getParentCourseEnrollments(session.user.id);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">My Courses</h2>
        <p className="mt-1 text-sm text-explore-charcoal/70">
          Courses purchased or enrolled for your linked students.
        </p>
      </div>

      {enrollments.length === 0 ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <p className="text-explore-charcoal/60">No enrolled courses yet.</p>
          <p className="mt-2 text-sm text-explore-charcoal/50">
            When you enroll a child in a course, it will appear here.
          </p>
          <Link
            href="/courses"
            className="mt-4 inline-block rounded-lg bg-explore-teal px-4 py-2 text-sm font-semibold text-white"
          >
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {enrollments.map((enrollment) => (
            <article
              key={enrollment.id}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-explore-teal">
                    {enrollment.studentName}
                  </p>
                  <h3 className="mt-1 font-display text-xl text-explore-charcoal">
                    {enrollment.courseTitle}
                  </h3>
                  {enrollment.shortDescription && (
                    <p className="mt-1 text-sm text-explore-charcoal/60">
                      {enrollment.shortDescription}
                    </p>
                  )}
                  {enrollment.instructor && (
                    <p className="mt-2 text-sm text-explore-charcoal/70">
                      Instructor: <span className="font-medium">{enrollment.instructor}</span>
                    </p>
                  )}
                  <p className="mt-1 text-xs capitalize text-explore-charcoal/50">
                    {enrollment.paymentStatus} · {enrollment.status}
                  </p>
                </div>
                <Link
                  href={`/courses/${enrollment.courseSlug}`}
                  className="shrink-0 rounded-lg bg-explore-teal px-4 py-2 text-sm font-semibold text-white"
                >
                  View Course
                </Link>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span>Progress</span>
                  <span className="font-semibold">{enrollment.progress}%</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-explore-sand">
                  <div
                    className="h-full rounded-full bg-explore-lime"
                    style={{ width: `${enrollment.progress}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-explore-charcoal/50">
                  {enrollment.completedLessons} of {enrollment.totalLessons} lessons completed
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
