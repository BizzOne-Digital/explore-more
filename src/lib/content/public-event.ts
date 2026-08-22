import { getEventPriceCents } from "@/lib/pricing";
import type { PublicEvent } from "@/types/public";

type EventRecord = Record<string, unknown>;

export function mapPublicEvent(raw: EventRecord): PublicEvent {
  const priceAmount = Number(raw.priceAmount ?? 0);
  const eventType = (raw.eventType as PublicEvent["eventType"]) ?? (priceAmount > 0 ? "paid" : "free");
  const isFree = eventType === "free" || priceAmount === 0;

  return {
    _id: String(raw._id),
    slug: String(raw.slug ?? ""),
    title: String(raw.title ?? ""),
    shortDescription: String(raw.shortDescription ?? ""),
    fullDescription: String(raw.fullDescription ?? ""),
    coverImage: raw.coverImage ? String(raw.coverImage) : undefined,
    gallery: Array.isArray(raw.gallery) ? raw.gallery.map(String) : [],
    startDate: String(raw.startDate ?? ""),
    endDate: String(raw.endDate ?? ""),
    startTime: String(raw.startTime ?? ""),
    endTime: String(raw.endTime ?? ""),
    timezone: String(raw.timezone ?? "America/New_York"),
    location: String(raw.location ?? ""),
    mapLink: raw.mapLink ? String(raw.mapLink) : undefined,
    isOnline: Boolean(raw.isOnline),
    capacity: raw.capacity != null ? Number(raw.capacity) : undefined,
    registrationDeadline: raw.registrationDeadline ? String(raw.registrationDeadline) : undefined,
    ageRange: raw.ageRange ? String(raw.ageRange) : undefined,
    grade: raw.grade ? String(raw.grade) : undefined,
    parentRequired: Boolean(raw.parentRequired),
    whatToBring: raw.whatToBring ? String(raw.whatToBring) : undefined,
    instructions: raw.instructions ? String(raw.instructions) : undefined,
    contactName: raw.contactName ? String(raw.contactName) : undefined,
    contactEmail: raw.contactEmail ? String(raw.contactEmail) : undefined,
    contactPhone: raw.contactPhone ? String(raw.contactPhone) : undefined,
    eventType,
    priceAmount,
    priceCents: isFree ? 0 : getEventPriceCents({ priceAmount, eventType }),
    registrationEnabled: raw.registrationEnabled !== false,
    featured: Boolean(raw.featured),
    category: raw.category ? String(raw.category) : undefined,
    status: String(raw.status ?? "draft"),
    metaTitle: raw.metaTitle ? String(raw.metaTitle) : undefined,
    metaDescription: raw.metaDescription ? String(raw.metaDescription) : undefined,
  };
}

export function mapPublicEvents(items: EventRecord[]): PublicEvent[] {
  return items.map(mapPublicEvent);
}
