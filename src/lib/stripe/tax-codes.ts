/**
 * Stripe product tax codes for Managed Payments.
 * @see https://docs.stripe.com/tax/tax-categories
 */
export const STRIPE_TAX_CODES = {
  /** Educational services, tutoring, homeschool programs */
  education: process.env.STRIPE_TAX_CODE_EDUCATION || "txcd_20060052",
  /** Membership / subscription access */
  membership: process.env.STRIPE_TAX_CODE_MEMBERSHIP || "txcd_20060052",
  /** Digital books and downloadable materials */
  books: process.env.STRIPE_TAX_CODE_BOOKS || "txcd_20030000",
  /** Online courses and digital learning */
  courses: process.env.STRIPE_TAX_CODE_COURSES || "txcd_10501000",
  /** Events, workshops, field trips */
  events: process.env.STRIPE_TAX_CODE_EVENTS || "txcd_20060052",
  /** Charitable donations */
  donations: process.env.STRIPE_TAX_CODE_DONATIONS || "txcd_20030003",
  /** General fallback */
  general: process.env.STRIPE_DEFAULT_TAX_CODE || "txcd_20060052",
} as const;

export type StripeTaxCodeKey = keyof typeof STRIPE_TAX_CODES;

export function stripeProductData(
  data: { name: string; description?: string },
  category: StripeTaxCodeKey = "general"
) {
  return {
    name: data.name,
    ...(data.description ? { description: data.description } : {}),
    tax_code: STRIPE_TAX_CODES[category],
  };
}
