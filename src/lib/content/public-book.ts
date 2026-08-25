import { dollarsToCents } from "@/lib/utils";
import type { PublicBook } from "@/types/public";

/** Matches admin publish state and `isBookPublished()` in pricing.ts */
export const PUBLISHED_BOOK_FILTER = {
  $or: [{ publishedToWebsite: true as const }, { status: "published" as const }],
};

export function mapPublicBook(raw: Record<string, unknown>): PublicBook {
  const priceAmount = Number(raw.priceAmount ?? 0);
  const salePriceAmount =
    raw.salePriceAmount != null ? Number(raw.salePriceAmount) : undefined;

  return {
    _id: String(raw._id),
    slug: String(raw.slug),
    title: String(raw.title),
    author: String(raw.author ?? ""),
    subtitle: raw.subtitle as string | undefined,
    shortDescription: String(raw.shortDescription ?? ""),
    fullDescription: String(raw.fullDescription ?? ""),
    coverImage: raw.coverImage as string | undefined,
    priceCents: dollarsToCents(priceAmount),
    salePriceCents:
      salePriceAmount != null ? dollarsToCents(salePriceAmount) : undefined,
    category: raw.category as string | undefined,
    format: raw.format as string | undefined,
    pageCount: raw.pageCount as number | undefined,
    ageRange: raw.ageRange as string | undefined,
    isbn: raw.isbn as string | undefined,
    stockStatus: raw.stockStatus as string | undefined,
    featured: raw.featured as boolean | undefined,
    metaTitle: raw.metaTitle as string | undefined,
    metaDescription: raw.metaDescription as string | undefined,
  };
}

export function mapPublicBooks(rows: Record<string, unknown>[]): PublicBook[] {
  return rows.map(mapPublicBook);
}
