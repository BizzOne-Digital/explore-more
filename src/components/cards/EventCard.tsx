import { format } from "date-fns";
import { MapPin, Calendar } from "lucide-react";
import { Card, CardImage, CardBody, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatCents } from "@/lib/utils";

import type { PublicEvent } from "@/types/public";

interface EventCardProps {
  event: PublicEvent;
}

const FALLBACK = "https://images.unsplash.com/photo-1478131143081-80f7f84b84c7?w=800&q=80";

export function EventCard({ event }: EventCardProps) {
  return (
    <Card href={`/events/${event.slug}`}>
      <CardImage src={event.coverImage || FALLBACK} alt={event.title} />
      <CardBody>
        <div className="mb-3 flex flex-wrap gap-2">
          {event.category && <Badge variant="teal">{event.category}</Badge>}
          {event.isOnline && <Badge variant="lime">Online</Badge>}
          {event.priceCents === 0 ? (
            <Badge variant="forest">Free</Badge>
          ) : (
            <Badge variant="orange">{formatCents(event.priceCents)}</Badge>
          )}
        </div>
        <CardTitle>{event.title}</CardTitle>
        <CardDescription>{event.shortDescription}</CardDescription>
        <div className="mt-4 space-y-1.5 text-xs text-explore-charcoal/60">
          <p className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-explore-teal" />
            {format(new Date(event.startDate), "EEEE, MMM d, yyyy · h:mm a")}
          </p>
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-explore-teal" />
            {event.location}
          </p>
        </div>
      </CardBody>
    </Card>
  );
}
