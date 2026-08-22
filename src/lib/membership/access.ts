import connectDB from "@/lib/db";
import { GuardianStudentLink, ParentSubscription, SubscriptionPlan } from "@/models";
import { getTierBySlug, type MembershipTierId } from "@/lib/membership/plans";
import {
  getTierFeatures,
  type MembershipFeature,
  tierHasFeature,
} from "@/lib/membership/entitlements";

export interface MembershipAccess {
  hasActiveMembership: boolean;
  tierId: MembershipTierId | null;
  planName: string | null;
  planSlug: string | null;
  features: MembershipFeature[];
  hasFeature: (feature: MembershipFeature) => boolean;
}

const NO_ACCESS: MembershipAccess = {
  hasActiveMembership: false,
  tierId: null,
  planName: null,
  planSlug: null,
  features: [],
  hasFeature: () => false,
};

function buildAccess(params: {
  tierId: MembershipTierId;
  planName: string;
  planSlug: string;
}): MembershipAccess {
  const features = getTierFeatures(params.tierId);
  return {
    hasActiveMembership: true,
    tierId: params.tierId,
    planName: params.planName,
    planSlug: params.planSlug,
    features,
    hasFeature: (feature) => tierHasFeature(params.tierId, feature),
  };
}

export async function getParentMembershipAccess(userId: string): Promise<MembershipAccess> {
  await connectDB();

  const subscription = await ParentSubscription.findOne({ userId }).populate("planId").lean();
  if (!subscription || !["active", "trialing"].includes(subscription.status)) {
    return NO_ACCESS;
  }

  const plan = subscription.planId as { name?: string; slug?: string } | null;
  if (!plan?.slug) return NO_ACCESS;

  const tier = getTierBySlug(plan.slug);
  if (!tier) return NO_ACCESS;

  return buildAccess({
    tierId: tier.id,
    planName: plan.name ?? tier.name,
    planSlug: plan.slug,
  });
}

export async function getStudentMembershipAccess(studentUserId: string): Promise<MembershipAccess> {
  await connectDB();

  const links = await GuardianStudentLink.find({
    studentId: studentUserId,
    status: "approved",
  })
    .select("guardianId")
    .lean();

  let best: MembershipAccess = NO_ACCESS;

  for (const link of links) {
    const parentAccess = await getParentMembershipAccess(link.guardianId.toString());
    if (!parentAccess.hasActiveMembership || !parentAccess.hasFeature("studentDashboard")) {
      continue;
    }
    if (
      !best.hasActiveMembership ||
      (parentAccess.tierId &&
        best.tierId &&
        parentAccess.features.length > best.features.length)
    ) {
      best = parentAccess;
    }
  }

  return best;
}
