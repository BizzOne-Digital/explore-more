import type { MembershipTierId } from "@/lib/membership/plans";

export type MembershipFeature =
  | "parentDashboard"
  | "studentDashboard"
  | "newsletter"
  | "activityPack"
  | "memberEventPricing"
  | "communityAnnouncements"
  | "midTermAssessment"
  | "facebookCommunity"
  | "digitalResourceLibrary"
  | "educatorMembershipCard"
  | "studentIdCard"
  | "earlyEventRegistration"
  | "monthlyBook"
  | "tutoringSession30"
  | "bookstoreDiscount15"
  | "priorityProgramRegistration"
  | "tutoringSession60"
  | "bookstoreDiscount20"
  | "priorityTutoringScheduling"
  | "vipEventRegistration"
  | "annualPlanningConsultation";

export const TIER_RANK: Record<MembershipTierId, number> = {
  explorer: 1,
  pathfinder: 2,
  adventurer: 3,
  trailblazer: 4,
  summit: 5,
  legacy: 6,
};

const EXPLORER_FEATURES: MembershipFeature[] = [
  "parentDashboard",
  "studentDashboard",
  "newsletter",
  "activityPack",
  "memberEventPricing",
  "communityAnnouncements",
];

const PATHFINDER_FEATURES: MembershipFeature[] = [
  ...EXPLORER_FEATURES,
  "midTermAssessment",
  "facebookCommunity",
  "digitalResourceLibrary",
];

const ADVENTURER_FEATURES: MembershipFeature[] = [
  ...PATHFINDER_FEATURES,
  "educatorMembershipCard",
  "studentIdCard",
  "earlyEventRegistration",
];

const TRAILBLAZER_FEATURES: MembershipFeature[] = [
  ...ADVENTURER_FEATURES,
  "monthlyBook",
  "tutoringSession30",
];

const SUMMIT_FEATURES: MembershipFeature[] = [
  ...TRAILBLAZER_FEATURES,
  "bookstoreDiscount15",
  "priorityProgramRegistration",
];

const LEGACY_FEATURES: MembershipFeature[] = [
  ...SUMMIT_FEATURES.filter((f) => f !== "tutoringSession30"),
  "tutoringSession60",
  "bookstoreDiscount20",
  "priorityTutoringScheduling",
  "vipEventRegistration",
  "annualPlanningConsultation",
];

export const TIER_FEATURES: Record<MembershipTierId, MembershipFeature[]> = {
  explorer: EXPLORER_FEATURES,
  pathfinder: PATHFINDER_FEATURES,
  adventurer: ADVENTURER_FEATURES,
  trailblazer: TRAILBLAZER_FEATURES,
  summit: SUMMIT_FEATURES,
  legacy: LEGACY_FEATURES,
};

export function getTierFeatures(tierId: MembershipTierId): MembershipFeature[] {
  return TIER_FEATURES[tierId];
}

export function tierHasFeature(tierId: MembershipTierId, feature: MembershipFeature): boolean {
  return TIER_FEATURES[tierId].includes(feature);
}

export function tierMeetsMinimum(tierId: MembershipTierId, minimum: MembershipTierId): boolean {
  return TIER_RANK[tierId] >= TIER_RANK[minimum];
}
