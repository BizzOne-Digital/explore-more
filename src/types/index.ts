import type { Role } from "@/lib/constants";
import type { EventPackageItemType } from "@/lib/events/packages";

export type PublishStatus = "draft" | "published" | "archived" | "cancelled" | "completed";

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  emailVerified: boolean;
  image?: string;
}

export interface BookCartItem {
  type: "book";
  bookId: string;
  slug: string;
  title: string;
  coverImage?: string;
  priceCents: number;
  quantity: number;
}

export interface EventPackageCartItem {
  type: "event_package";
  eventId: string;
  eventSlug: string;
  eventTitle: string;
  packageId: string;
  title: string;
  imageUrl?: string;
  itemType: EventPackageItemType;
  priceCents: number;
  quantity: number;
}

/** @deprecated Use BookCartItem — legacy carts may omit `type`. */
export type LegacyBookCartItem = Omit<BookCartItem, "type"> & { type?: "book" };

export type CartItem = BookCartItem | EventPackageCartItem | LegacyBookCartItem;

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}
