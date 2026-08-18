export type MembershipTierId =
  | "explorer"
  | "pathfinder"
  | "adventurer"
  | "trailblazer"
  | "summit"
  | "legacy";

export type BillingInterval = "month" | "year";

export interface MembershipTier {
  id: MembershipTierId;
  emoji: string;
  name: string;
  tagline: string;
  monthlyPriceCents: number;
  annualPriceCents: number;
  features: string[];
  bestFor: string;
  popular?: boolean;
  sortOrder: number;
}

export const MEMBERSHIP_TIERS: MembershipTier[] = [
  {
    id: "explorer",
    emoji: "🧭",
    name: "Explorer Membership",
    tagline: "Perfect for families beginning their homeschooling adventure.",
    monthlyPriceCents: 999,
    annualPriceCents: 9900,
    features: [
      "Parent Dashboard Account",
      "Student Dashboard Account",
      "Monthly Explore More Newsletter",
      "Monthly Educational Activity Pack",
      "Member Pricing on Select Events",
      "Access to Community Announcements",
    ],
    bestFor: "Families looking for affordable educational resources.",
    sortOrder: 1,
  },
  {
    id: "pathfinder",
    emoji: "🥾",
    name: "Pathfinder Membership",
    tagline: "Take your homeschool journey to the next level.",
    monthlyPriceCents: 2499,
    annualPriceCents: 24900,
    features: [
      "Parent Dashboard Account",
      "Student Dashboard Account",
      "Monthly Explore More Newsletter",
      "Monthly Educational Activity Pack",
      "One Mid-Term Assessment/Evaluation",
      "Access to the Private Facebook Community",
      "Digital Resource Library",
      "Member Pricing on Events",
    ],
    bestFor: "Parents who want assessments and a homeschool community.",
    sortOrder: 2,
  },
  {
    id: "adventurer",
    emoji: "🏕️",
    name: "Adventurer Membership",
    tagline: "Designed for active homeschool families.",
    monthlyPriceCents: 3999,
    annualPriceCents: 39900,
    features: [
      "Parent Dashboard Account",
      "Student Dashboard Account",
      "Monthly Newsletter",
      "Monthly Activity Pack",
      "One Mid-Term Assessment/Evaluation",
      "Explore More Academy Homeschool Educator Membership Card",
      "One Student ID Card",
      "Private Facebook Community",
      "Early Registration for Events & Field Trips",
    ],
    bestFor: "Families wanting official membership benefits and early event access.",
    sortOrder: 3,
  },
  {
    id: "trailblazer",
    emoji: "🦁",
    name: "Trailblazer Membership",
    tagline: "Everything you need for continued educational success.",
    monthlyPriceCents: 5999,
    annualPriceCents: 59900,
    features: [
      "Parent Dashboard Account",
      "Student Dashboard Account",
      "Monthly Newsletter",
      "Monthly Activity Pack",
      "One Mid-Term Assessment/Evaluation",
      "Homeschool Educator Membership Card",
      "One Student ID Card",
      "Private Facebook Community",
      "Early Event Registration",
      "One Explore More Academy Book Every Month",
      "One FREE 30-Minute Tutoring Session",
    ],
    bestFor: "Families wanting monthly books and academic support.",
    popular: true,
    sortOrder: 4,
  },
  {
    id: "summit",
    emoji: "🏔️",
    name: "Summit Membership",
    tagline: "Premium support for growing learners.",
    monthlyPriceCents: 7999,
    annualPriceCents: 79900,
    features: [
      "Parent Dashboard Account",
      "Student Dashboard Account",
      "Monthly Newsletter",
      "Monthly Activity Pack",
      "One Mid-Term Assessment/Evaluation",
      "Homeschool Educator Membership Card",
      "One Student ID Card",
      "Private Facebook Community",
      "Early Event Registration",
      "One Explore More Academy Book Every Month",
      "One FREE 30-Minute Tutoring Session",
      "15% Discount in the Explore More Academy Bookstore",
      "Priority Registration for Programs & Field Trips",
    ],
    bestFor: "Families who regularly participate in Explore More Academy programs.",
    sortOrder: 5,
  },
  {
    id: "legacy",
    emoji: "👑",
    name: "Legacy Membership",
    tagline: "Our ultimate homeschool membership experience.",
    monthlyPriceCents: 9999,
    annualPriceCents: 99900,
    features: [
      "Parent Dashboard Account",
      "Student Dashboard Account",
      "Monthly Newsletter",
      "Monthly Activity Pack",
      "One Mid-Term Assessment/Evaluation",
      "Homeschool Educator Membership Card",
      "One Student ID Card",
      "Private Facebook Community",
      "Early Event Registration",
      "One Explore More Academy Book Every Month",
      "Two FREE 60-Minute Tutoring Sessions",
      "20% Discount in the Explore More Academy Bookstore",
      "Priority Scheduling for Tutoring",
      "VIP Registration for Events & Field Trips",
      "Annual Homeschool Planning Consultation",
    ],
    bestFor:
      "Families seeking comprehensive educational support, tutoring, and exclusive member benefits.",
    sortOrder: 6,
  },
];

export function membershipPlanSlug(tierId: MembershipTierId, interval: BillingInterval): string {
  return `${tierId}-${interval === "month" ? "monthly" : "annual"}`;
}

export function getTierPriceCents(tier: MembershipTier, interval: BillingInterval): number {
  return interval === "month" ? tier.monthlyPriceCents : tier.annualPriceCents;
}

export function getTierBySlug(slug: string): MembershipTier | undefined {
  const tier = MEMBERSHIP_TIERS.find(
    (t) => membershipPlanSlug(t.id, "month") === slug || membershipPlanSlug(t.id, "year") === slug
  );
  return tier;
}

export function annualSavingsMonths(tier: MembershipTier): number {
  const monthlyTotal = tier.monthlyPriceCents * 12;
  const savings = monthlyTotal - tier.annualPriceCents;
  if (savings <= 0) return 0;
  return Math.round(savings / tier.monthlyPriceCents);
}

/** Seed-friendly plan rows for SubscriptionPlan collection. */
export function buildSubscriptionPlanSeedRows() {
  return MEMBERSHIP_TIERS.flatMap((tier) => [
    {
      name: `${tier.name.replace(" Membership", "")} Monthly`,
      slug: membershipPlanSlug(tier.id, "month"),
      description: tier.tagline,
      priceCents: tier.monthlyPriceCents,
      interval: "month" as const,
      features: tier.features,
      isActive: true,
      sortOrder: tier.sortOrder * 2 - 1,
    },
    {
      name: `${tier.name.replace(" Membership", "")} Annual`,
      slug: membershipPlanSlug(tier.id, "year"),
      description: `${tier.tagline} Pay annually and receive 2 months FREE.`,
      priceCents: tier.annualPriceCents,
      interval: "year" as const,
      features: tier.features,
      isActive: true,
      sortOrder: tier.sortOrder * 2,
    },
  ]);
}
