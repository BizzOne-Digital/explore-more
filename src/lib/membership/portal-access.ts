import connectDB from "@/lib/db";
import { GuardianStudentLink } from "@/models";
import {
  getParentMembershipAccess,
  getStudentMembershipAccess,
} from "@/lib/membership/access";

export type PortalType = "parent" | "student";

export type StudentPortalBlockReason =
  | "no_guardian_link"
  | "link_pending"
  | "parent_no_membership"
  | "parent_plan_ineligible";

export interface PortalAccessResult {
  hasAccess: boolean;
  redirectUrl: string | null;
  reason?:
    | "wrong_role"
    | "subscription_required"
    | "inactive_account"
    | StudentPortalBlockReason;
  detail?: string;
}

export async function diagnoseStudentPortalAccess(studentUserId: string): Promise<{
  hasAccess: boolean;
  reason?: StudentPortalBlockReason;
  detail?: string;
}> {
  await connectDB();

  const links = await GuardianStudentLink.find({ studentId: studentUserId }).lean();
  if (links.length === 0) {
    return {
      hasAccess: false,
      reason: "no_guardian_link",
      detail:
        "Your student account is not linked to a parent yet. Ask your parent to link you from their portal, or contact the academy.",
    };
  }

  const approved = links.filter((link) => link.status === "approved");
  const pending = links.filter((link) => link.status === "pending");

  if (approved.length === 0) {
    if (pending.length > 0) {
      return {
        hasAccess: false,
        reason: "link_pending",
        detail:
          "Your parent link is waiting for approval. A parent or academy staff member needs to approve the connection before you can sign in.",
      };
    }
    return {
      hasAccess: false,
      reason: "no_guardian_link",
      detail:
        "Your student account is not linked to an approved parent. Contact the academy for help.",
    };
  }

  let anyParentWithMembership = false;
  let anyParentWithEligiblePlan = false;

  for (const link of approved) {
    const parentAccess = await getParentMembershipAccess(link.guardianId.toString());
    if (parentAccess.hasActiveMembership) {
      anyParentWithMembership = true;
      if (parentAccess.hasFeature("studentDashboard")) {
        anyParentWithEligiblePlan = true;
        break;
      }
    }
  }

  if (!anyParentWithMembership) {
    return {
      hasAccess: false,
      reason: "parent_no_membership",
      detail:
        "Your linked parent does not have an active membership or trial. They need an Active or Trialing subscription before you can access the student portal.",
    };
  }

  if (!anyParentWithEligiblePlan) {
    return {
      hasAccess: false,
      reason: "parent_plan_ineligible",
      detail:
        "Your family's membership plan does not include student portal access. Contact the academy to upgrade or fix the subscription plan.",
    };
  }

  return { hasAccess: true };
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
  if (access.hasActiveMembership) {
    return {
      hasAccess: true,
      redirectUrl: "/student",
    };
  }

  const diagnosis = await diagnoseStudentPortalAccess(userId);
  return {
    hasAccess: false,
    redirectUrl: null,
    reason: diagnosis.reason ?? "subscription_required",
    detail: diagnosis.detail,
  };
}
