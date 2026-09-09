import type { MembershipFeature } from "@/lib/membership/entitlements";

type ParentRouteRule = {
  prefix: string;
  exact?: boolean;
  anyOf: MembershipFeature[];
};

/** Parent portal routes and the membership features that unlock them. */
export const PARENT_ROUTE_RULES: ParentRouteRule[] = [
  { prefix: "/parent/assessments", anyOf: ["midTermAssessment", "parentDashboard"] },
  { prefix: "/parent/portfolio", anyOf: ["parentDashboard"] },
  { prefix: "/parent/courses", anyOf: ["purchasedCourses", "parentDashboard"] },
  { prefix: "/parent/resources", anyOf: ["digitalResourceLibrary", "parentDashboard"] },
  { prefix: "/parent/books", anyOf: ["purchasedBooks", "monthlyBook", "parentDashboard"] },
  { prefix: "/parent/tutors", anyOf: ["parentDashboard"] },
  { prefix: "/parent/notifications", anyOf: ["communityAnnouncements", "parentDashboard"] },
  { prefix: "/parent/messages", anyOf: ["parentMessaging", "parentDashboard"] },
  { prefix: "/parent/account", anyOf: ["parentProfile", "parentDashboard"] },
  { prefix: "/parent/receipts", anyOf: ["orderReceipts", "parentDashboard"] },
  { prefix: "/parent/tools", anyOf: ["parentDashboard"] },
  { prefix: "/parent/students", anyOf: ["parentDashboard"] },
  { prefix: "/parent/attendance", anyOf: ["parentDashboard"] },
  { prefix: "/parent/certificates", anyOf: ["parentDashboard"] },
  { prefix: "/parent", exact: true, anyOf: ["freeDashboard", "parentDashboard"] },
];

export function isParentPathAllowed(
  pathname: string,
  hasFeature: (feature: MembershipFeature) => boolean
): boolean {
  if (pathname === "/parent/billing" || pathname.startsWith("/parent/billing/")) {
    return true;
  }

  for (const rule of PARENT_ROUTE_RULES) {
    const matches = rule.exact ? pathname === rule.prefix : pathname.startsWith(rule.prefix);
    if (matches) {
      return rule.anyOf.some(hasFeature);
    }
  }

  if (pathname.startsWith("/parent")) {
    return hasFeature("parentDashboard");
  }

  return true;
}

/** @deprecated Use isParentPathAllowed */
export function getRequiredFeatureForParentPath(pathname: string): MembershipFeature | null {
  if (pathname === "/parent/billing") return null;
  for (const rule of PARENT_ROUTE_RULES) {
    const matches = rule.exact ? pathname === rule.prefix : pathname.startsWith(rule.prefix);
    if (matches) return rule.anyOf[0];
  }
  if (pathname.startsWith("/parent")) return "parentDashboard";
  return null;
}

export function getRequiredFeatureForStudentPath(pathname: string): MembershipFeature | null {
  if (pathname === "/student/results") return "midTermAssessment";
  if (pathname === "/student/resources") return "digitalResourceLibrary";
  if (pathname.startsWith("/student")) return "studentDashboard";
  return null;
}
