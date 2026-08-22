import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { getCourseBySlug } from "@/lib/queries/public";
import { formatCents } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { EnrollmentButton } from "@/components/forms/EnrollmentButton";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const course = await getCourseBySlug(slug);
  if (!course) return { title: "Course Not Found" };
  return {
    title: course.metaTitle || course.title,
    description: course.metaDescription || course.shortDescription,
  };
}

export default async function CourseDetailPage({ params }: Props) {
  const { slug } = await params;
  const [course, session] = await Promise.all([getCourseBySlug(slug), auth()]);
  if (!course) notFound();

  return (
    <>
      <section className="relative w-full overflow-x-clip bg-explore-charcoal text-white pt-28 pb-16">
        <div className="absolute inset-0 bg-gradient-to-br from-explore-charcoal via-explore-teal/20 to-explore-charcoal" />
        <div className="relative mx-auto w-full min-w-0 max-w-4xl px-3 sm:px-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {course.category && <Badge variant="lime">{course.category}</Badge>}
            {course.difficulty && <Badge variant="teal">{course.difficulty}</Badge>}
            {course.enrollmentStatus === "waitlist" && <Badge variant="orange">Waitlist</Badge>}
          </div>
          <h1 className="break-anywhere font-display text-3xl font-bold sm:text-4xl lg:text-5xl">{course.title}</h1>
          <p className="mt-4 text-lg text-white/80">{course.shortDescription}</p>
          {course.instructor && (
            <p className="mt-3 text-sm text-explore-lime">Instructor: {course.instructor}</p>
          )}
        </div>
      </section>

      <section className="w-full overflow-x-clip py-16 bg-explore-cream">
        <div className="mx-auto w-full min-w-0 max-w-4xl px-3 sm:px-4 grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="font-display text-2xl font-bold mb-4">About This Course</h2>
              <div className="text-explore-charcoal/80 leading-relaxed whitespace-pre-wrap">{course.fullDescription}</div>
            </div>

            {course.learningOutcomes &&
              course.learningOutcomes.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-bold mb-4">Learning Outcomes</h2>
                <ul className="space-y-2">
                  {course.learningOutcomes.map((outcome: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-explore-charcoal/70">
                      <CheckCircle className="h-4 w-4 text-explore-teal shrink-0 mt-0.5" />
                      {outcome}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {course.modules &&
              course.modules.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-bold mb-4">Curriculum</h2>
                <div className="space-y-4">
                  {course.modules
                    .sort((a, b) => a.order - b.order)
                    .map((mod) => (
                      <div key={String(mod._id)} className="rounded-xl bg-white border border-explore-charcoal/10 p-5">
                        <h3 className="font-semibold text-explore-charcoal">{mod.title}</h3>
                        {mod.description && <p className="mt-1 text-sm text-explore-charcoal/60">{mod.description}</p>}
                        {mod.lessons?.length > 0 && (
                          <ul className="mt-3 space-y-1 text-sm text-explore-charcoal/70">
                            {mod.lessons.map((lesson, i) => (
                              <li key={i}>• {lesson.title}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          <aside>
            <div className="rounded-2xl bg-white border border-explore-charcoal/10 p-6 shadow-sm sticky top-28 space-y-4">
              <p className="font-display text-2xl font-bold">
                {course.isFree || course.priceCents === 0 ? "Free" : formatCents(course.priceCents)}
              </p>
              {course.ageRange && <p className="text-sm text-explore-charcoal/60">Ages: {course.ageRange}</p>}
              {course.schedule && <p className="text-sm text-explore-charcoal/60">Schedule: {course.schedule}</p>}
              {course.deliveryFormat && <p className="text-sm text-explore-charcoal/60">Format: {course.deliveryFormat}</p>}
              {course.prerequisites && (
                <p className="text-sm text-explore-charcoal/60">Prerequisites: {course.prerequisites}</p>
              )}
              <EnrollmentButton
                courseId={course._id}
                courseSlug={course.slug}
                courseTitle={course.title}
                priceCents={course.priceCents}
                isFree={!!course.isFree}
                enrollmentStatus={course.enrollmentStatus}
              />
              {session && (
                <p className="text-xs text-explore-charcoal/40">Signed in as {session.user.email}</p>
              )}
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
