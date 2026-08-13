import type { Metadata } from "next";
import { getAllTestimonials } from "@/lib/queries/public";
import { createSectionChecker, getPageSectionVisibility } from "@/lib/queries/pages";
import { PageHero } from "@/components/ui/PageHero";
import { TestimonialCard } from "@/components/cards/TestimonialCard";

export const metadata: Metadata = {
  title: "Testimonials",
  description: "Stories from families, students, and partners of Explore More Academy.",
};

const FALLBACK = [
  { authorName: "Homeschool Parent", authorRole: "Maryland", content: "Explore More Academy gave our kids a reason to love Mondays. The blend of science, adventure, and community is unmatched.", rating: 5 },
  { authorName: "Community Partner", authorRole: "Youth Organization", content: "We've sent dozens of students through EMA programs. Every single one comes back more confident and curious.", rating: 5 },
  { authorName: "Sponsor", authorRole: "Local Business", content: "Knowing our donation directly puts a kid on the trail — that's the kind of impact we want to support.", rating: 5 },
  { authorName: "Student Alumni", authorRole: "Age 16", content: "The leadership program changed how I see myself. I went from shy kid to team captain in one season.", rating: 5 },
  { authorName: "Educator", authorRole: "Partner School", content: "EMA instructors are professional, prepared, and genuinely care about every student in the group.", rating: 5 },
  { authorName: "Grandparent", authorRole: "Sponsor", content: "I sponsor two grandchildren's program fees every year. Best investment in their future I could make.", rating: 5 },
];

export default async function TestimonialsPage() {
  const show = createSectionChecker(await getPageSectionVisibility("testimonials"));
  const testimonials = await getAllTestimonials().catch(() => [] as Awaited<ReturnType<typeof getAllTestimonials>>);
  const items = testimonials.length > 0 ? testimonials : FALLBACK;

  return (
    <>
      {show("hero") && (
        <PageHero
          title="Community Stories"
          subtitle="Hear from families, students, partners, and sponsors who've walked the trail with us."
          eyebrow="Testimonials"
        />
      )}
      {show("list") && (
        <section className="w-full overflow-x-clip py-16 bg-explore-cream min-h-[50vh]">
          <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((t, i) => (
                <TestimonialCard key={"_id" in t ? String(t._id) : i} testimonial={t} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
