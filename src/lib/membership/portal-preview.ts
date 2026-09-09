import { getTierBySlug, type MembershipTierId } from "@/lib/membership/plans";
import {
  FREE_ACCOUNT_FEATURES,
  getTierFeatures,
  type MembershipFeature,
} from "@/lib/membership/entitlements";
import {
  filterParentNavForMembership,
  filterStudentNavForMembership,
} from "@/lib/membership/nav-filter";
import { FREE_ACCOUNT_PLAN } from "@/lib/membership/free-account";

export const PORTAL_ACCESS_STATUSES = ["active", "trialing"] as const;

export type PortalAccessStatus = (typeof PORTAL_ACCESS_STATUSES)[number];

export interface PortalAccessPreview {
  hasPortalAccess: boolean;
  isFreeAccount: boolean;
  tierId: MembershipTierId | "free" | null;
  tierName: string | null;
  features: MembershipFeature[];
  parentNavLabels: string[];
  studentNavLabels: string[];
}

function buildFreePreview(): PortalAccessPreview {
  const features = FREE_ACCOUNT_FEATURES;
  return {
    hasPortalAccess: true,
    isFreeAccount: true,
    tierId: "free",
    tierName: FREE_ACCOUNT_PLAN.name,
    features,
    parentNavLabels: filterParentNavForMembership(features).flatMap((group) =>
      group.items.map((item) => item.label)
    ),
    studentNavLabels: [],
  };
}

export function previewPortalAccess(
  planSlug: string | null | undefined,
  status: string
): PortalAccessPreview {
  const isPaid =
    Boolean(planSlug) && PORTAL_ACCESS_STATUSES.includes(status as PortalAccessStatus);

  if (!isPaid) {
    return buildFreePreview();
  }

  const tier = getTierBySlug(planSlug!);
  if (!tier) {
    return buildFreePreview();
  }

  const features = getTierFeatures(tier.id);
  return {
    hasPortalAccess: true,
    isFreeAccount: false,
    tierId: tier.id,
    tierName: tier.name,
    features,
    parentNavLabels: filterParentNavForMembership(features).flatMap((group) =>
      group.items.map((item) => item.label)
    ),
    studentNavLabels: filterStudentNavForMembership(features).map((item) => item.label),
  };
}
