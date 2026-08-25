import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Enrollment, Course } from "@/models";
import {
  getStudentGrade,
  getPublishedCoursesForGrade,
} from "@/lib/grades/queries";
import { formatGradeLabel, matchesStudentGrade } from "@/lib/grades";

export default async function StudentCoursesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/student/courses");

  await connectDB();

  const studentGrade = await getStudentGrade(session.user.id);

  const [enrollments, availableCourses] = await Promise.all([
    Enrollment.find({
      userId: session.user.id,
      status: { $ne: "cancelled" },
    })
      .populate("courseId")
      .sort({ enrolledAt: -1 }),
    studentGrade ? getPublishedCoursesForGrade(studentGrade) : Promise.resolve([]),
  ]);

  const enrolledCourseIds = new Set(
    enrollments
      .map((e) => {
        const course = e.courseId as { _id?: { toString(): string } } | null;
        return course?._id?.toString();
      })
      .filter(Boolean)
  );

  const browseCourses = availableCourses.filter(
    (c) => !enrolledCourseIds.has(c._id.toString())
  );

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl text-explore-charcoal">My Courses</h2>
        <p className="mt-1 text-explore-charcoal/70">
          Your enrolled courses and progress
          {studentGrade ? ` · ${formatGradeLabel(studentGrade)}` : ""}.
        </p>
      </div>

      {enrollments.length === 0 ? (
        <div className="rounded-2xl bg-explore-white p-8 text-center shadow-sm">
          <p className="text-explore-charcoal/60">You are not enrolled in any courses yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {enrollments.map((enrollment) => {
            const course = enrollment.courseId as unknown as InstanceType<typeof Course> | null;
            if (!course) return null;
            if (studentGrade && !matchesStudentGrade(course.grade, studentGrade)) return null;

            const totalLessons = course.modules.reduce(
              (sum, m) => sum + m.lessons.length,
              0
            );

            return (
              <article
                key={enrollment._id.toString()}
                className="rounded-2xl bg-explore-white p-6 shadow-sm"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="font-display text-xl text-explore-charcoal">{course.title}</h3>
                    <p className="mt-1 text-sm text-explore-charcoal/60">{course.shortDescription}</p>
                    {course.instructor && (
                      <p className="mt-2 text-sm">
                        Instructor: <span className="font-medium">{course.instructor}</span>
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/courses/${course.slug}`}
                    className="shrink-0 rounded-lg bg-explore-teal px-4 py-2 text-sm font-semibold text-white"
                  >
                    Continue Learning
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
                    {enrollment.completedLessons.length} of {totalLessons} lessons completed
                  </p>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {studentGrade && browseCourses.length > 0 && (
        <section>
          <h3 className="font-display text-lg text-explore-charcoal">
            Available for {formatGradeLabel(studentGrade)}
          </h3>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {browseCourses.map((course) => (
              <Link
                key={course._id.toString()}
                href={`/courses/${course.slug}`}
                className="rounded-xl border border-explore-sand bg-explore-white p-4 shadow-sm transition hover:border-explore-teal/40"
              >
                <p className="font-semibold text-explore-charcoal">{course.title}</p>
                <p className="mt-1 line-clamp-2 text-sm text-explore-charcoal/60">
                  {course.shortDescription}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
