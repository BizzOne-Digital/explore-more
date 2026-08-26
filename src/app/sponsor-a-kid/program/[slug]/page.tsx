import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { getSponsorableProgramBySlug } from "@/lib/queries/public";
import { SponsorProgramForm } from "@/components/forms/SponsorProgramForm";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const program = await getSponsorableProgramBySlug(slug);
  if (!program) return { title: "Program Not Found" };
  return {
    title: `Sponsor ${program.title}`,
    description: program.shortDescription,
  };
}

export default async function SponsorProgramPage({ params }: Props) {
  const { slug } = await params;
  const program = await getSponsorableProgramBySlug(slug);
  if (!program) notFound();

  const cover =
    program.heroImage ||
    "https://images.unsplash.com/photo-1469571486292-0ba58a3f068b?w=1200&q=80";

  return (
    <>
      <section className="relative w-full overflow-x-clip bg-explore-charcoal text-white pt-28 pb-12">
        <div className="absolute inset-0">
          <Image src={cover} alt="" fill className="object-cover opacity-30" sizes="100vw" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-explore-charcoal to-explore-charcoal/70" />
        </div>
        <div className="relative mx-auto w-full min-w-0 max-w-4xl px-3 sm:px-4">
          <h1 className="break-anywhere font-display text-3xl font-bold sm:text-4xl lg:text-5xl">
            Sponsor {program.title}
          </h1>
          <p className="mt-4 text-lg text-white/80">{program.tagline}</p>
          <p className="mt-2 text-sm text-white/60">{program.shortDescription}</p>
        </div>
      </section>

      <section className="w-full overflow-x-clip py-16 bg-explore-cream">
        <div className="mx-auto w-full min-w-0 max-w-lg px-3 sm:px-4">
          <div className="rounded-2xl border border-explore-charcoal/10 bg-white p-4 shadow-sm sm:p-8">
            <h2 className="font-display text-2xl font-bold mb-6">Sponsor This Program</h2>
            <SponsorProgramForm
              programSlug={program.slug}
              programTitle={program.title}
              sponsorshipAmount={program.sponsorshipAmount}
            />
          </div>
        </div>
      </section>
    </>
  );
}
