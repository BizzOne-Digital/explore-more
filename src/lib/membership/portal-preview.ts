import { getTierBySlug, type MembershipTierId } from "@/lib/membership/plans";
import { getTierFeatures, type MembershipFeature } from "@/lib/membership/entitlements";
import {
  filterParentNavForMembership,
  filterStudentNavForMembership,
} from "@/lib/membership/nav-filter";

export const PORTAL_ACCESS_STATUSES = ["active", "trialing"] as const;

export type PortalAccessStatus = (typeof PORTAL_ACCESS_STATUSES)[number];

export interface PortalAccessPreview {
  hasPortalAccess: boolean;
  tierId: MembershipTierId | null;
  tierName: string | null;
  features: MembershipFeature[];
  parentNavLabels: string[];
  studentNavLabels: string[];
}

export function previewPortalAccess(
  planSlug: string | null | undefined,
  status: string
): PortalAccessPreview {
  const inactive =
    !planSlug || !PORTAL_ACCESS_STATUSES.includes(status as PortalAccessStatus);

  if (inactive) {
    return {
      hasPortalAccess: false,
      tierId: null,
      tierName: null,
      features: [],
      parentNavLabels: [],
      studentNavLabels: [],
    };
  }

  const tier = getTierBySlug(planSlug);
  if (!tier) {
    return {
      hasPortalAccess: false,
      tierId: null,
      tierName: null,
      features: [],
      parentNavLabels: [],
      studentNavLabels: [],
    };
  }

  const features = getTierFeatures(tier.id);
  return {
    hasPortalAccess: true,
    tierId: tier.id,
    tierName: tier.name,
    features,
    parentNavLabels: filterParentNavForMembership(features).flatMap((group) =>
      group.items.map((item) => item.label)
    ),
    studentNavLabels: filterStudentNavForMembership(features).map((item) => item.label),
  };
}
