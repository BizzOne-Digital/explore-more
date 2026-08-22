import { apiError } from "@/lib/admin/api";
import {
  getParentMembershipAccess,
  getStudentMembershipAccess,
} from "@/lib/membership/access";
import type { MembershipFeature } from "@/lib/membership/entitlements";

export async function requireParentMembershipFeature(
  userId: string,
  feature: MembershipFeature,
  role?: string
) {
  if (role === "administrator") {
    return { ok: true as const };
  }

  const access = await getParentMembershipAccess(userId);
  if (!access.hasActiveMembership) {
    return {
      ok: false as const,
      response: apiError(new Error("An active membership is required. Please subscribe at /membership."), 403),
    };
  }

  if (!access.hasFeature(feature)) {
    return {
      ok: false as const,
      response: apiError(
        new Error("Your membership plan does not include this feature. Upgrade at /membership."),
        403
      ),
    };
  }

  return { ok: true as const, access };
}

export async function requireStudentMembershipFeature(
  userId: string,
  feature: MembershipFeature,
  role?: string
) {
  if (role === "administrator") {
    return { ok: true as const };
  }

  const access = await getStudentMembershipAccess(userId);
  if (!access.hasActiveMembership) {
    return {
      ok: false as const,
      response: apiError(
        new Error("Student portal access requires an active family membership. Visit /membership."),
        403
      ),
    };
  }

  if (!access.hasFeature(feature)) {
    return {
      ok: false as const,
      response: apiError(
        new Error("Your family's membership plan does not include this feature."),
        403
      ),
    };
  }

  return { ok: true as const, access };
}
