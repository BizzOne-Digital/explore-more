import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { getEventBySlug } from "@/lib/queries/public";
import { formatCents } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event Not Found" };
  return {
    title: event.metaTitle || event.title,
    description: event.metaDescription || event.shortDescription,
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const isUpcoming = new Date(event.startDate) > new Date();
  const cover =
    event.coverImage ||
    "https://images.unsplash.com/photo-1478131143081-80f7f84b84c7?w=1200&q=80";

  return (
    <>
      <section className="relative w-full overflow-x-clip bg-explore-charcoal text-white pt-28 pb-16">
        <div className="absolute inset-0">
          <Image src={cover} alt="" fill className="object-cover opacity-30" sizes="100vw" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-explore-charcoal via-explore-charcoal/80 to-explore-charcoal/60" />
        </div>
        <div className="relative mx-auto w-full min-w-0 max-w-4xl px-3 sm:px-4">
          <div className="flex flex-wrap gap-2 mb-4">
            {event.category && <Badge variant="lime">{event.category}</Badge>}
            {event.isOnline && <Badge variant="teal">Online</Badge>}
            {!isUpcoming && <Badge variant="orange">Past Event</Badge>}
          </div>
          <h1 className="break-anywhere font-display text-3xl font-bold sm:text-4xl lg:text-5xl">{event.title}</h1>
          <p className="mt-4 text-lg text-white/80">{event.shortDescription}</p>
          <div className="mt-6 flex flex-wrap gap-6 text-sm text-white/70">
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-explore-lime" />
              {format(new Date(event.startDate), "EEEE, MMMM d, yyyy · h:mm a")}
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-explore-lime" />
              {event.location}
            </span>
            {event.ageRange && (
              <span className="flex items-center gap-2">
                <Users className="h-4 w-4 text-explore-lime" />
                Ages {event.ageRange}
              </span>
            )}
          </div>
        </div>
      </section>

      <section className="w-full overflow-x-clip py-16 bg-explore-cream">
        <div className="mx-auto w-full min-w-0 max-w-4xl px-3 sm:px-4 grid lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 prose prose-explore max-w-none">
            <div
              className="text-explore-charcoal/80 leading-relaxed whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: event.fullDescription.replace(/\n/g, "<br/>") }}
            />
            {event.whatToBring && (
              <div className="mt-8 rounded-xl bg-white border border-explore-charcoal/10 p-6">
                <h3 className="font-display text-lg font-bold text-explore-charcoal mb-2">What to Bring</h3>
                <p className="text-sm text-explore-charcoal/70 whitespace-pre-wrap">{event.whatToBring}</p>
              </div>
            )}
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl bg-white border border-explore-charcoal/10 p-6 shadow-sm sticky top-28">
              <p className="font-display text-2xl font-bold text-explore-charcoal">
                {event.priceCents === 0 ? "Free" : formatCents(event.priceCents)}
              </p>
              {event.registrationDeadline && (
                <p className="mt-2 text-xs text-explore-charcoal/50 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  Register by {format(new Date(event.registrationDeadline), "MMM d, yyyy")}
                </p>
              )}
              {event.parentRequired && (
                <p className="mt-2 text-xs text-explore-orange font-medium">Parent/guardian required</p>
              )}
              {isUpcoming && event.registrationEnabled ? (
                <Button href="/login" className="w-full mt-4" size="lg">
                  Register Now
                </Button>
              ) : (
                <Button disabled className="w-full mt-4" size="lg" variant="outline">
                  Registration Closed
                </Button>
              )}
              {event.mapLink && (
                <a
                  href={event.mapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-3 block text-center text-sm text-explore-teal hover:underline"
                >
                  View on Map
                </a>
              )}
            </div>
          </aside>
        </div>
      </section>
    </>
  );
}
