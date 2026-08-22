import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import {
  Calendar,
  MapPin,
  Users,
  Clock,
  Mail,
  Phone,
  User,
  Globe,
  Info,
} from "lucide-react";
import { getEventBySlug } from "@/lib/queries/public";
import { formatCents } from "@/lib/utils";
import { resolveImageUrl } from "@/lib/images/resolve";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AppImage } from "@/components/ui/AppImage";

interface Props {
  params: Promise<{ slug: string }>;
}

const FALLBACK_COVER =
  "https://images.unsplash.com/photo-1478131143081-80f7f84b84c7?w=1200&q=80";

function formatTimeLabel(time: string): string {
  const match = /^(\d{1,2}):(\d{2})/.exec(time.trim());
  if (!match) return time;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return time;
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return format(date, "h:mm a");
}

function formatEventPrice(event: { eventType: string; priceCents: number }): string {
  if (event.eventType === "free" || event.priceCents === 0) return "Free";
  return formatCents(event.priceCents);
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

  const now = new Date();
  const startDate = new Date(event.startDate);
  const endDate = new Date(event.endDate);
  const isUpcoming = startDate > now;
  const sameDay = format(startDate, "yyyy-MM-dd") === format(endDate, "yyyy-MM-dd");
  const cover = event.coverImage ? resolveImageUrl(event.coverImage) : FALLBACK_COVER;
  const priceLabel = formatEventPrice(event);

  const dateLine = sameDay
    ? `${format(startDate, "EEEE, MMMM d, yyyy")}`
    : `${format(startDate, "MMM d, yyyy")} – ${format(endDate, "MMM d, yyyy")}`;

  const timeLine =
    event.startTime && event.endTime
      ? `${formatTimeLabel(event.startTime)} – ${formatTimeLabel(event.endTime)}`
      : format(startDate, "h:mm a");

  const registrationOpen =
    isUpcoming &&
    event.registrationEnabled &&
    (!event.registrationDeadline || new Date(event.registrationDeadline) >= now);

  return (
    <>
      <section className="relative w-full overflow-hidden bg-explore-charcoal text-white">
        <div className="absolute inset-0">
          <AppImage
            src={cover}
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
            priority
            unoptimized={cover.startsWith("http")}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-explore-charcoal via-explore-charcoal/90 to-explore-charcoal/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-explore-charcoal/90 via-transparent to-explore-charcoal/30" />
        </div>

        <div className="relative mx-auto flex min-h-[420px] w-full max-w-6xl flex-col justify-end px-4 pb-12 pt-32 sm:px-6 lg:min-h-[480px] lg:pb-16 lg:pt-36">
          <div className="flex flex-wrap gap-2">
            {event.category && <Badge variant="lime">{event.category}</Badge>}
            {event.isOnline && <Badge variant="teal">Online</Badge>}
            {event.eventType === "free" || event.priceCents === 0 ? (
              <Badge variant="forest">Free</Badge>
            ) : (
              <Badge variant="orange">{priceLabel}</Badge>
            )}
            {!isUpcoming && <Badge variant="orange">Past Event</Badge>}
            {event.featured && <Badge variant="teal">Featured</Badge>}
          </div>

          <h1 className="mt-4 max-w-3xl font-display text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl">
            {event.title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/85">{event.shortDescription}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:max-w-3xl">
            <div className="flex items-start gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <Calendar className="mt-0.5 h-5 w-5 shrink-0 text-explore-lime" />
              <div>
                <p className="text-sm font-semibold text-white">{dateLine}</p>
                <p className="text-sm text-white/70">
                  {timeLine}
                  {event.timezone ? ` · ${event.timezone.replace(/_/g, " ")}` : ""}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
              <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-explore-lime" />
              <div>
                <p className="text-sm font-semibold text-white">
                  {event.isOnline ? "Online Event" : event.location}
                </p>
                {event.mapLink && !event.isOnline && (
                  <a
                    href={event.mapLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-explore-lime hover:underline"
                  >
                    View on map
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full overflow-x-clip bg-explore-cream py-16">
        <div className="mx-auto grid w-full min-w-0 max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-3">
          <div className="space-y-8 lg:col-span-2">
            <div>
              <h2 className="font-display text-2xl font-bold text-explore-charcoal">About This Event</h2>
              <div
                className="mt-4 leading-relaxed text-explore-charcoal/80 whitespace-pre-wrap"
                dangerouslySetInnerHTML={{
                  __html: event.fullDescription.replace(/\n/g, "<br/>"),
                }}
              />
            </div>

            {(event.instructions || event.whatToBring) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {event.instructions && (
                  <div className="rounded-2xl border border-explore-charcoal/10 bg-white p-6 shadow-sm">
                    <h3 className="flex items-center gap-2 font-display text-lg font-bold text-explore-charcoal">
                      <Info className="h-5 w-5 text-explore-teal" />
                      Instructions
                    </h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-explore-charcoal/70">
                      {event.instructions}
                    </p>
                  </div>
                )}
                {event.whatToBring && (
                  <div className="rounded-2xl border border-explore-charcoal/10 bg-white p-6 shadow-sm">
                    <h3 className="font-display text-lg font-bold text-explore-charcoal">What to Bring</h3>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-explore-charcoal/70">
                      {event.whatToBring}
                    </p>
                  </div>
                )}
              </div>
            )}

            {event.gallery && event.gallery.length > 0 && (
              <div>
                <h2 className="font-display text-2xl font-bold text-explore-charcoal">Gallery</h2>
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {event.gallery.map((image, index) => (
                    <div
                      key={`${image}-${index}`}
                      className="relative aspect-[4/3] overflow-hidden rounded-xl bg-explore-sand"
                    >
                      <AppImage
                        src={resolveImageUrl(image)}
                        alt={`${event.title} photo ${index + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="sticky top-28 space-y-5 rounded-2xl border border-explore-charcoal/10 bg-white p-6 shadow-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-explore-charcoal/50">
                  Registration
                </p>
                <p className="mt-1 font-display text-3xl font-bold text-explore-charcoal">{priceLabel}</p>
              </div>

              <dl className="space-y-3 border-t border-explore-charcoal/10 pt-4 text-sm">
                {event.ageRange && (
                  <div className="flex items-start gap-2">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-explore-teal" />
                    <div>
                      <dt className="font-medium text-explore-charcoal">Ages</dt>
                      <dd className="text-explore-charcoal/70">{event.ageRange}</dd>
                    </div>
                  </div>
                )}
                {event.capacity != null && event.capacity > 0 && (
                  <div className="flex items-start gap-2">
                    <Users className="mt-0.5 h-4 w-4 shrink-0 text-explore-teal" />
                    <div>
                      <dt className="font-medium text-explore-charcoal">Capacity</dt>
                      <dd className="text-explore-charcoal/70">{event.capacity} spots</dd>
                    </div>
                  </div>
                )}
                {event.registrationDeadline && (
                  <div className="flex items-start gap-2">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-explore-teal" />
                    <div>
                      <dt className="font-medium text-explore-charcoal">Register by</dt>
                      <dd className="text-explore-charcoal/70">
                        {format(new Date(event.registrationDeadline), "MMMM d, yyyy")}
                      </dd>
                    </div>
                  </div>
                )}
                {event.isOnline && (
                  <div className="flex items-start gap-2">
                    <Globe className="mt-0.5 h-4 w-4 shrink-0 text-explore-teal" />
                    <div>
                      <dt className="font-medium text-explore-charcoal">Format</dt>
                      <dd className="text-explore-charcoal/70">Online / virtual</dd>
                    </div>
                  </div>
                )}
              </dl>

              {event.parentRequired && (
                <p className="rounded-lg bg-explore-orange/10 px-3 py-2 text-xs font-medium text-explore-orange">
                  Parent or guardian required for registration
                </p>
              )}

              {registrationOpen ? (
                <Button
                  href={`/login?callbackUrl=${encodeURIComponent(`/events/${event.slug}`)}`}
                  className="w-full"
                  size="lg"
                >
                  Register Now
                </Button>
              ) : (
                <Button disabled className="w-full" size="lg" variant="outline">
                  Registration Closed
                </Button>
              )}
            </div>

            {(event.contactName || event.contactEmail || event.contactPhone) && (
              <div className="rounded-2xl border border-explore-charcoal/10 bg-white p-6 shadow-sm">
                <h3 className="font-display text-lg font-bold text-explore-charcoal">Contact</h3>
                <ul className="mt-4 space-y-3 text-sm text-explore-charcoal/70">
                  {event.contactName && (
                    <li className="flex items-center gap-2">
                      <User className="h-4 w-4 text-explore-teal" />
                      {event.contactName}
                    </li>
                  )}
                  {event.contactEmail && (
                    <li className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-explore-teal" />
                      <a href={`mailto:${event.contactEmail}`} className="hover:text-explore-teal">
                        {event.contactEmail}
                      </a>
                    </li>
                  )}
                  {event.contactPhone && (
                    <li className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-explore-teal" />
                      <a href={`tel:${event.contactPhone}`} className="hover:text-explore-teal">
                        {event.contactPhone}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </section>
    </>
  );
}
