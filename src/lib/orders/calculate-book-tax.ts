import type { BookShippingLine } from "@/lib/orders/book-shipping";
import { isDigitalBookLine } from "@/lib/orders/book-shipping";
import { getStateSalesTaxRatePercent } from "@/lib/orders/us-state-tax";

export type BookTaxResult = {
  taxCents: number;
  taxRatePercent: number;
  jurisdiction: string;
  taxableSubtotalCents: number;
};

export function getTaxableSubtotalCents(items: BookShippingLine[]): number {
  return items
    .filter((item) => !isDigitalBookLine(item) && item.priceCents > 0)
    .reduce((sum, item) => sum + item.priceCents * item.quantity, 0);
}

export function calculateBookTaxCents(
  items: BookShippingLine[],
  shippingCents: number,
  state: string,
  fallbackTaxRatePercent = 0,
  donationCents = 0
): BookTaxResult {
  let taxableSubtotalCents = getTaxableSubtotalCents(items);
  if (taxableSubtotalCents <= 0 && donationCents > 0) {
    taxableSubtotalCents = donationCents;
  }
  const jurisdiction = state.trim().toUpperCase().slice(0, 2);

  if (taxableSubtotalCents <= 0) {
    return {
      taxCents: 0,
      taxRatePercent: 0,
      jurisdiction,
      taxableSubtotalCents: 0,
    };
  }

  const taxRatePercent = getStateSalesTaxRatePercent(state, fallbackTaxRatePercent);
  const taxableBaseCents = taxableSubtotalCents + shippingCents;
  const taxCents = Math.round(taxableBaseCents * (taxRatePercent / 100));

  return {
    taxCents,
    taxRatePercent,
    jurisdiction,
    taxableSubtotalCents,
  };
}
