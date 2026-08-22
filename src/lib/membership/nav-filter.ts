import type { MembershipFeature } from "@/lib/membership/entitlements";
import { parentNavGroups, type ParentNavGroup } from "@/lib/parent/nav";

export function filterParentNavForMembership(features: MembershipFeature[]): ParentNavGroup[] {
  const hasFeature = (feature: MembershipFeature) => features.includes(feature);

  return parentNavGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => {
        if (!item.requiredFeature && !item.requiredAnyFeatures?.length) return true;
        if (item.requiredFeature && hasFeature(item.requiredFeature)) return true;
        if (item.requiredAnyFeatures?.some((f) => hasFeature(f))) return true;
        return false;
      }),
    }))
    .filter((group) => group.items.length > 0);
}

export const STUDENT_NAV_ITEMS: Array<{
  href: string;
  label: string;
  requiredFeature?: MembershipFeature;
}> = [
  { href: "/student", label: "Dashboard", requiredFeature: "studentDashboard" },
  { href: "/student/courses", label: "My Courses", requiredFeature: "studentDashboard" },
  { href: "/student/programs", label: "Programs", requiredFeature: "studentDashboard" },
  { href: "/student/results", label: "Results", requiredFeature: "midTermAssessment" },
  { href: "/student/events", label: "Events", requiredFeature: "memberEventPricing" },
  { href: "/student/certificates", label: "My Certificates", requiredFeature: "studentDashboard" },
  { href: "/student/resources", label: "Resources", requiredFeature: "digitalResourceLibrary" },
  { href: "/student/messages", label: "Messages", requiredFeature: "studentDashboard" },
  { href: "/student/profile", label: "Profile", requiredFeature: "studentDashboard" },
];

export function filterStudentNavForMembership(features: MembershipFeature[]) {
  const hasFeature = (feature: MembershipFeature) => features.includes(feature);
  return STUDENT_NAV_ITEMS.filter(
    (item) => !item.requiredFeature || hasFeature(item.requiredFeature)
  );
}
