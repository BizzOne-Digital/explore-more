import { dollarsToCents } from "@/lib/utils";

type PricedItem = { priceAmount: number; salePriceAmount?: number; isFree?: boolean };

export function priceAmountToCents(amount: number): number {
  return dollarsToCents(amount);
}

export function getBookPriceCents(book: PricedItem): number {
  const amount = book.salePriceAmount ?? book.priceAmount;
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
