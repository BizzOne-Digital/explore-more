import type { Metadata } from "next";
import Image from "next/image";
import { COMPANY } from "@/lib/constants";
import { HERO_IMAGES, BRAND_IMAGES, DIFFERENTIATORS } from "@/lib/content/home";
import { createSectionChecker, getPageSectionVisibility } from "@/lib/queries/pages";
import { PageHero } from "@/components/ui/PageHero";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "About Us",
  description: `Learn about ${COMPANY.name} — ${COMPANY.mission}`,
};

export default async function AboutPage() {
  const show = createSectionChecker(await getPageSectionVisibility("about"));

  return (
    <>
      {show("hero") && (
        <PageHero
          title="About Explore More Academy"
          subtitle="We believe the best classroom has no walls — just trails, rivers, forests, and curious minds."
          eyebrow="Our Story"
          image={HERO_IMAGES.about}
          size="large"
        >
          <Button href="/programs" variant="primary">Our Programs</Button>
          <Button href="/contact" variant="outline" className="border-white/30 text-white hover:border-explore-lime hover:text-explore-lime">
            Contact Us
          </Button>
        </PageHero>
      )}

      {show("story") && (
        <section className="w-full overflow-x-clip py-20 bg-explore-cream">
          <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4 grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <SectionHeading
                eyebrow="Who We Are"
                title="Learning Beyond the Classroom"
                description={COMPANY.mission}
              />
              <p className="mt-6 text-explore-charcoal/70 leading-relaxed">
                Explore More Academy LLC was founded on a simple belief: when young people connect with nature,
                community, and real-world challenges, they discover strengths they never knew they had. We serve
                homeschool families, traditional students, and youth organizations across the region with programs
                that blend rigorous learning with genuine adventure.
              </p>
              <p className="mt-4 text-explore-charcoal/70 leading-relaxed">
                From single-day field trips to multi-week courses, every experience is designed to build confidence,
                curiosity, and character. Our team of educators, naturalists, and mentors bring decades of combined
                experience in outdoor education, youth development, and hands-on STEM.
              </p>
            </div>
            <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
              <Image
                src={BRAND_IMAGES.outdoorEducation}
                alt="Outdoor learning group"
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            </div>
          </div>
        </section>
      )}

      {show("tagline") && (
        <section className="w-full overflow-x-clip py-20 bg-explore-forest text-white">
          <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4 text-center">
            <p className="font-display text-3xl sm:text-4xl font-bold italic">&ldquo;{COMPANY.tagline}&rdquo;</p>
            <p className="mt-4 text-explore-lime font-semibold tracking-widest uppercase text-sm">{COMPANY.motto}</p>
          </div>
        </section>
      )}

      {show("values") && (
        <section className="w-full overflow-x-clip py-20 bg-white">
          <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4">
            <SectionHeading eyebrow="Our Values" title="What Guides Us" align="center" className="mb-12 mx-auto" />
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {DIFFERENTIATORS.map((item) => (
                <div key={item.title} className="text-center p-6">
                  <span className="text-4xl">{item.icon}</span>
                  <h3 className="mt-4 font-display text-xl font-bold">{item.title}</h3>
                  <p className="mt-2 text-sm text-explore-charcoal/70">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {show("pillars") && (
        <section className="w-full overflow-x-clip py-20 bg-explore-sand/50">
          <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4 grid md:grid-cols-3 gap-8 text-center">
            {[
              { title: "Explore", desc: "Discover the natural world through hands-on field experiences." },
              { title: "Educate", desc: "Connect academic concepts to real places, problems, and projects." },
              { title: "Empower", desc: "Build the skills and confidence youth need for limitless futures." },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl bg-white p-8 shadow-sm border border-explore-charcoal/8">
                <h3 className="font-display text-2xl font-bold text-explore-teal">{item.title}</h3>
                <p className="mt-3 text-sm text-explore-charcoal/70">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {show("cta") && (
        <section className="w-full overflow-x-clip py-20 bg-explore-charcoal text-white text-center">
          <div className="mx-auto w-full min-w-0 max-w-2xl px-3 sm:px-4">
            <h2 className="font-display text-3xl font-bold">Join the Adventure</h2>
            <p className="mt-4 text-white/70">Whether you&apos;re a parent, educator, or community partner — we&apos;d love to connect.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <Button href="/register" variant="primary">Create Account</Button>
              <Button href="/contact" variant="lime">Contact Us</Button>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
