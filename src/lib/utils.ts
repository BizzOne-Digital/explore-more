export function safeSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Currency formatting - displays cents as USD
export function formatCents(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100);
}

export function formatCurrency(cents: number): string {
  return formatCents(cents);
}

// Format price with optional USD label (e.g., "$25.00 USD")
export function formatPrice(cents: number, showCurrency: boolean = true): string {
  const formatted = formatCents(cents);
  return showCurrency ? `${formatted} USD` : formatted;
}

// Convert dollars to cents for storage (maintains precision)
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

// Convert cents to dollars for display/calculation
export function centsToDollars(cents: number): number {
  return cents / 100;
}

// Format amount as dollars (for input fields)
export function formatDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}
