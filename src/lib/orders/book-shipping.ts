export const BOOK_FLAT_SHIPPING_CENTS = 599;
export const BOOK_FREE_SHIPPING_THRESHOLD_CENTS = 5000;

export type BookShippingLine = {
  priceCents: number;
  quantity: number;
  isDigital?: boolean;
};

export function isDigitalBookLine(item: { isDigital?: boolean }): boolean {
  return item.isDigital === true;
}

export function cartRequiresShippingAddress(items: BookShippingLine[]): boolean {
  return items.some((item) => !isDigitalBookLine(item));
}

export function cartIsFreeOnly(items: BookShippingLine[]): boolean {
  return items.length > 0 && items.every((item) => item.priceCents === 0);
}

export function calculateBookShippingCents(items: BookShippingLine[]): number {
  if (items.length === 0) return 0;
  if (items.every((item) => item.priceCents === 0)) return 0;
  if (items.every((item) => isDigitalBookLine(item))) return 0;

  const subtotalCents = items.reduce((sum, item) => sum + item.priceCents * item.quantity, 0);

  const needsShipping = items.some(
    (item) => !isDigitalBookLine(item) && item.priceCents > 0
  );

  if (!needsShipping) return 0;
  return subtotalCents >= BOOK_FREE_SHIPPING_THRESHOLD_CENTS ? 0 : BOOK_FLAT_SHIPPING_CENTS;
}
