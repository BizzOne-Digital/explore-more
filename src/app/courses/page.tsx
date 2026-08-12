import type { Metadata } from "next";
import { HERO_IMAGES } from "@/lib/content/home";
import { getAllPublishedCourses } from "@/lib/queries/public";
import { PageHero } from "@/components/ui/PageHero";
import { CourseCard } from "@/components/cards/CourseCard";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = {
  title: "Courses",
  description: "Multi-week courses in outdoor education, STEM, art, and leadership.",
};

export default async function CoursesPage() {
  const courses = await getAllPublishedCourses().catch(() => [] as Awaited<ReturnType<typeof getAllPublishedCourses>>);

  return (
    <>
      <PageHero
        title="Courses"
        subtitle="Deep-dive learning experiences led by expert guides — from beginner trails to advanced summits."
        eyebrow="Learn"
        image={HERO_IMAGES.courses}
        align="center"
      />
      <section className="w-full overflow-x-clip py-16 bg-explore-cream min-h-[50vh]">
        <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4">
          {courses.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {courses.map((course) => (
                <CourseCard key={course._id} course={course} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Courses coming soon"
              description="New courses are being prepared. Stay tuned!"
              actionLabel="View Programs"
              actionHref="/programs"
            />
          )}
        </div>
      </section>
    </>
  );
}
