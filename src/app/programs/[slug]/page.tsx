import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { CheckCircle } from "lucide-react";
import { getProgramBySlug } from "@/lib/queries/public";
import { CORE_PROGRAMS, BRAND_IMAGES } from "@/lib/content/home";
import { formatGradeLabel } from "@/lib/grades";
import { Badge } from "@/components/ui/Badge";
import { ServiceRequestForm } from "@/components/forms/ServiceRequestForm";
import { FAQAccordion } from "@/components/cards/FAQAccordion";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);
  if (program) {
    return {
      title: program.metaTitle || program.title,
      description: program.metaDescription || program.shortDescription,
    };
  }
  const staticProgram = CORE_PROGRAMS.find((p) => p.slug === slug);
  return {
    title: staticProgram?.title || "Program",
    description: staticProgram?.description,
  };
}

export default async function ProgramDetailPage({ params }: Props) {
  const { slug } = await params;
  const program = await getProgramBySlug(slug);
  const staticProgram = CORE_PROGRAMS.find((p) => p.slug === slug);

  if (!program && !staticProgram) notFound();

  const title = program?.title || staticProgram!.title;
  const tagline = program?.tagline || staticProgram!.tagline;
  const description = program?.shortDescription || staticProgram!.description;
  const overview = program?.overview || staticProgram!.description;
  const heroImage =
    program?.heroImage ||
    staticProgram?.heroImage ||
    staticProgram?.image ||
    BRAND_IMAGES.outdoorEducation;

  return (
    <>
      <section className="relative w-full overflow-x-clip bg-explore-charcoal text-white pt-28 pb-16">
        <div className="absolute inset-0">
          <Image src={heroImage} alt="" fill className="object-cover opacity-30" sizes="100vw" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-explore-charcoal via-explore-charcoal/80 to-explore-charcoal/60" />
        </div>
        <div className="relative mx-auto w-full min-w-0 max-w-4xl px-3 sm:px-4">
          {program?.featured && <Badge variant="lime" className="mb-3">Featured</Badge>}
          <p className="text-explore-lime text-sm font-semibold uppercase tracking-wider">{tagline}</p>
          <h1 className="mt-2 break-anywhere font-display text-3xl font-bold sm:text-4xl lg:text-5xl">{title}</h1>
          <p className="mt-4 text-lg text-white/80">{description}</p>
          {program?.ageRange && <p className="mt-3 text-sm text-white/60">Ages: {program.ageRange}</p>}
          {program?.grade && (
            <p className="mt-2 text-sm text-explore-lime">Grade: {formatGradeLabel(program.grade)}</p>
          )}
        </div>
      </section>

      <section className="w-full overflow-x-clip py-16 bg-explore-cream">
        <div className="mx-auto w-full min-w-0 max-w-4xl px-3 sm:px-4 grid lg:grid-cols-5 gap-12">
          <div className="lg:col-span-3 space-y-8">
            <div>
              <h2 className="font-display text-2xl font-bold mb-4">Overview</h2>
              <p className="text-explore-charcoal/80 leading-relaxed whitespace-pre-wrap">{overview}</p>
            </div>

            {program && program.benefits.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-bold mb-4">Benefits</h2>
                <ul className="space-y-2">
                  {program.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-explore-charcoal/70">
                      <CheckCircle className="h-4 w-4 text-explore-teal shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {program && program.activities.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-bold mb-4">Activities</h2>
                <div className="flex flex-wrap gap-2">
                  {program.activities.map((a, i) => (
                    <Badge key={i} variant="teal">{a}</Badge>
                  ))}
                </div>
              </div>
            )}

            {program?.schedule && (
              <div>
                <h2 className="font-display text-2xl font-bold mb-2">Schedule</h2>
                <p className="text-explore-charcoal/70">{program.schedule}</p>
              </div>
            )}

            {program && program.detailSections.length > 0 &&
              program.detailSections
                .sort((a, b) => a.order - b.order)
                .map((section) => (
                  <div key={String(section._id)}>
                    <h2 className="font-display text-2xl font-bold mb-4">{section.title}</h2>
                    <p className="text-explore-charcoal/80 leading-relaxed whitespace-pre-wrap">{section.content}</p>
                  </div>
                ))}

            {program && program.faqs.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-bold mb-4">Program FAQs</h2>
                <FAQAccordion items={program.faqs.map((f, i) => ({ ...f, _id: String(i) }))} />
              </div>
            )}
          </div>

          <div className="lg:col-span-2">
            <div className="rounded-2xl bg-white border border-explore-charcoal/10 p-6 shadow-sm sticky top-28">
              <h2 className="font-display text-xl font-bold mb-2">Request This Program</h2>
              <p className="text-sm text-explore-charcoal/60 mb-6">
                Tell us about your student and we&apos;ll customize the experience.
              </p>
              {program ? (
                <ServiceRequestForm
                  programId={program._id}
                  programSlug={program.slug}
                  programTitle={program.title}
                />
              ) : (
                <p className="text-sm text-explore-charcoal/70">
                  This program is available by request.{" "}
                  <a href="/contact" className="text-explore-teal hover:underline">Contact us</a> to get started.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
