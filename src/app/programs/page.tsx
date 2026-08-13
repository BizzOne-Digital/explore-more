import type { Metadata } from "next";
import { HERO_IMAGES, CORE_PROGRAMS } from "@/lib/content/home";
import { getPublishedPrograms } from "@/lib/queries/public";
import { createSectionChecker, getPageSectionVisibility } from "@/lib/queries/pages";
import { PageHero } from "@/components/ui/PageHero";
import { ProgramCard, StaticProgramCard } from "@/components/cards/ProgramCard";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const metadata: Metadata = {
  title: "Programs",
  description: "Outdoor education programs for youth — from nature labs to leadership trails.",
};

export default async function ProgramsPage() {
  const show = createSectionChecker(await getPageSectionVisibility("programs"));
  const programs = await getPublishedPrograms().catch(() => [] as Awaited<ReturnType<typeof getPublishedPrograms>>);

  return (
    <>
      {show("hero") && (
        <PageHero
          title="Our Programs"
          subtitle="Six core pathways — and growing. Every program connects learning to the real world."
          eyebrow="Explore"
          image={HERO_IMAGES.programs}
          align="center"
        />
      )}
      {show("listings") && (
        <section className="w-full overflow-x-clip py-16 bg-explore-cream">
          <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4">
            {programs.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {programs.map((program) => (
                  <ProgramCard
                    key={program._id}
                    program={program}
                    fallbackImage={CORE_PROGRAMS.find((p) => p.slug === program.slug)?.image}
                  />
                ))}
              </div>
            ) : (
              <>
                <SectionHeading
                  eyebrow="Core Offerings"
                  title="Six Adventure Pathways"
                  description="Request any program below — our team will customize the experience for your family or group."
                  align="center"
                  className="mb-12 mx-auto"
                />
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {CORE_PROGRAMS.map((program) => (
                    <StaticProgramCard
                      key={program.slug}
                      slug={program.slug}
                      title={program.title}
                      tagline={program.tagline}
                      description={program.description}
                      image={program.image}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      )}
    </>
  );
}
