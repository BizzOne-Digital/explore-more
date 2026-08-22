import type { MembershipFeature } from "@/lib/membership/entitlements";

/** Parent portal routes that require a specific membership feature. */
export const PARENT_ROUTE_FEATURES: Array<{
  prefix: string;
  feature: MembershipFeature;
  exact?: boolean;
}> = [
  { prefix: "/parent/assessments", feature: "midTermAssessment" },
  { prefix: "/parent/portfolio", feature: "digitalResourceLibrary" },
  { prefix: "/parent/books", feature: "monthlyBook" },
  { prefix: "/parent/tutors", feature: "tutoringSession30" },
  { prefix: "/parent/notifications", feature: "communityAnnouncements" },
];

export function getRequiredFeatureForParentPath(pathname: string): MembershipFeature | null {
  for (const route of PARENT_ROUTE_FEATURES) {
    if (route.exact && pathname === route.prefix) return route.feature;
    if (!route.exact && pathname.startsWith(route.prefix)) return route.feature;
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
