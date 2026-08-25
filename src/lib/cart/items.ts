import type { BookCartItem, CartItem, EventPackageCartItem } from "@/types";

export type AddCartItemInput =
  | (Omit<BookCartItem, "quantity"> & { quantity?: number })
  | (Omit<EventPackageCartItem, "quantity"> & { quantity?: number });

export function getCartItemKey(item: CartItem): string {
  if (item.type === "event_package") {
    return `event:${item.eventId}:${item.packageId}`;
  }
  return `book:${item.bookId}`;
}

export function normalizeCartItem(raw: CartItem): CartItem {
  if (raw.type === "event_package") return raw;
  if (raw.type === "book") return raw;
  return {
    type: "book",
    bookId: raw.bookId,
    slug: raw.slug,
    title: raw.title,
    coverImage: raw.coverImage,
    priceCents: raw.priceCents,
    quantity: raw.quantity,
  };
}

export function isBookCartItem(item: CartItem): item is BookCartItem {
  return !("type" in item) || item.type === "book";
}

export function isEventPackageCartItem(item: CartItem): item is EventPackageCartItem {
  return item.type === "event_package";
}
