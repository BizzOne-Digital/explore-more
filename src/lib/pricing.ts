import { dollarsToCents } from "@/lib/utils";

type PricedItem = { priceAmount: number; salePriceAmount?: number; isFree?: boolean };

export function priceAmountToCents(amount: number): number {
  return dollarsToCents(amount);
}

/** Sale price only applies when set, positive, and lower than regular price. */
export function getEffectiveBookSaleAmount(book: PricedItem): number | undefined {
  const regular = Number(book.priceAmount ?? 0);
  const sale =
    book.salePriceAmount != null ? Number(book.salePriceAmount) : undefined;
  if (sale == null || !Number.isFinite(sale) || sale <= 0 || sale >= regular) {
    return undefined;
  }
  return sale;
}

export function getBookPriceCents(book: PricedItem): number {
  const sale = getEffectiveBookSaleAmount(book);
  const amount = sale ?? Number(book.priceAmount ?? 0);
  return dollarsToCents(amount);
}

export function getCoursePriceCents(course: PricedItem): number {
  if (course.isFree || course.priceAmount === 0) return 0;
  return dollarsToCents(course.priceAmount);
}

export function getEventPriceCents(event: { priceAmount: number; eventType?: string }): number {
  if (event.eventType === "free" || event.priceAmount === 0) return 0;
  return dollarsToCents(event.priceAmount);
}

export function isBookPublished(book: {
  publishedToWebsite?: boolean;
  status?: string;
}): boolean {
  return book.publishedToWebsite === true || book.status === "published";
}

export function getCampaignGoalCents(campaign: { goalAmount: number }): number {
  return dollarsToCents(campaign.goalAmount);
}

export function getCampaignRaisedCents(campaign: { raisedAmount: number }): number {
  return dollarsToCents(campaign.raisedAmount);
}
