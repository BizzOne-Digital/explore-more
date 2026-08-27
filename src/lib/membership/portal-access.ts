import {
  getParentMembershipAccess,
  getStudentMembershipAccess,
} from "@/lib/membership/access";

export type PortalType = "parent" | "student";

export interface PortalAccessResult {
  hasAccess: boolean;
  redirectUrl: string | null;
  reason?: "wrong_role" | "subscription_required" | "inactive_account";
}

export async function getPortalAccessForUser(
  userId: string,
  role: string,
  portal: PortalType
): Promise<PortalAccessResult> {
  if (role === "administrator") {
    return {
      hasAccess: true,
      redirectUrl: portal === "parent" ? "/parent" : "/student",
    };
  }

  if (portal === "parent") {
    if (role !== "parent") {
      return { hasAccess: false, redirectUrl: null, reason: "wrong_role" };
    }
    const access = await getParentMembershipAccess(userId);
    return {
      hasAccess: access.hasActiveMembership,
      redirectUrl: access.hasActiveMembership ? "/parent" : null,
      reason: access.hasActiveMembership ? undefined : "subscription_required",
    };
  }

  if (role !== "student") {
    return { hasAccess: false, redirectUrl: null, reason: "wrong_role" };
  }

  const access = await getStudentMembershipAccess(userId);
  return {
    hasAccess: access.hasActiveMembership,
    redirectUrl: access.hasActiveMembership ? "/student" : null,
    reason: access.hasActiveMembership ? undefined : "subscription_required",
  };
}
