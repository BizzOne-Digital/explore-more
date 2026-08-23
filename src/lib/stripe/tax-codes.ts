/**
 * Stripe product tax codes for Managed Payments.
 * Managed Payments only accepts digital-goods PTCs (not physical services like txcd_2006xxxx).
 * @see https://docs.stripe.com/payments/managed-payments/eligibility#product-tax-code-requirements
 */
export const STRIPE_TAX_CODES = {
  /** Subscription access to the online parent/student portal (SaaS) */
  membership: process.env.STRIPE_TAX_CODE_MEMBERSHIP || "txcd_10103000",
  /** Self-study / streamed online courses */
  education: process.env.STRIPE_TAX_CODE_EDUCATION || "txcd_20060158",
  courses: process.env.STRIPE_TAX_CODE_COURSES || "txcd_20060158",
  /** Digital book downloads (physical bookstore checkout disables Managed Payments) */
  books: process.env.STRIPE_TAX_CODE_BOOKS || "txcd_10302000",
  /** In-person events — checkout passes managedPayments: false */
  events: process.env.STRIPE_TAX_CODE_EVENTS || "txcd_20060052",
  /** Donations — checkout passes managedPayments: false */
  donations: process.env.STRIPE_TAX_CODE_DONATIONS || "txcd_20030003",
  /** General digitally supplied services */
  general: process.env.STRIPE_DEFAULT_TAX_CODE || "txcd_10000000",
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
