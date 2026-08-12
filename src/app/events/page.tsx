import type { Metadata } from "next";
import { HERO_IMAGES } from "@/lib/content/home";
import { getAllPublishedEvents } from "@/lib/queries/public";
import { PageHero } from "@/components/ui/PageHero";
import { EventCard } from "@/components/cards/EventCard";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = {
  title: "Events",
  description: "Upcoming workshops, field trips, and adventures from Explore More Academy.",
};

export default async function EventsPage() {
  const events = await getAllPublishedEvents().catch(() => [] as Awaited<ReturnType<typeof getAllPublishedEvents>>);

  return (
    <>
      <PageHero
        title="Upcoming Events"
        subtitle="Workshops, field trips, seasonal camps, and community gatherings — join us outdoors."
        eyebrow="Calendar"
        image={HERO_IMAGES.events}
        align="center"
      />
      <section className="w-full overflow-x-clip py-16 bg-explore-cream min-h-[50vh]">
        <div className="mx-auto w-full min-w-0 max-w-7xl px-3 sm:px-4">
          {events.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event._id} event={event} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No upcoming events"
              description="We're planning new adventures. Check back soon or subscribe to our newsletter."
              actionLabel="View Programs"
              actionHref="/programs"
            />
          )}
        </div>
      </section>
    </>
  );
}
