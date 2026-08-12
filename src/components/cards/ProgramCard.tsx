import Image from "next/image";
import Link from "next/link";
import { Card, CardBody, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

import { BRAND_IMAGES } from "@/lib/content/home";

import type { PublicProgram } from "@/types/public";

interface ProgramCardProps {
  program: PublicProgram;
  fallbackImage?: string;
}

export function ProgramCard({ program, fallbackImage }: ProgramCardProps) {
  const image =
    program.heroImage ||
    fallbackImage ||
    BRAND_IMAGES.outdoorEducation;

  return (
    <Card href={`/programs/${program.slug}`}>
      <div className="relative aspect-[16/10] overflow-hidden bg-explore-sand">
        <Image
          src={image}
          alt={program.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
        {program.featured && (
          <div className="absolute top-3 left-3">
            <Badge variant="lime">Featured</Badge>
          </div>
        )}
      </div>
      <CardBody>
        <p className="text-xs font-semibold uppercase tracking-wider text-explore-orange mb-1">
          {program.tagline}
        </p>
        <CardTitle>{program.title}</CardTitle>
        <CardDescription>{program.shortDescription}</CardDescription>
        {program.ageRange && (
          <p className="mt-3 text-xs text-explore-charcoal/50">Ages {program.ageRange}</p>
        )}
      </CardBody>
    </Card>
  );
}

export function StaticProgramCard({
  title,
  tagline,
  description,
  image,
  slug,
}: {
  title: string;
  tagline: string;
  description: string;
  image: string;
  slug: string;
}) {
  return (
    <Link
      href={`/programs/${slug}`}
      className="group overflow-hidden rounded-2xl bg-white border border-explore-charcoal/8 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-explore-sand">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="p-5 sm:p-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-explore-orange mb-1">
          {tagline}
        </p>
        <h3 className="font-display text-xl font-bold text-explore-charcoal group-hover:text-explore-teal transition-colors">
          {title}
        </h3>
        <p className="mt-2 text-sm text-explore-charcoal/70 line-clamp-3">{description}</p>
      </div>
    </Link>
  );
}
