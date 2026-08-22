import type { LucideIcon } from "lucide-react";
import type { MembershipFeature } from "@/lib/membership/entitlements";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  CalendarDays,
  FolderOpen,
  MessagesSquare,
  GraduationCap,
  BookOpen,
  Receipt,
  CreditCard,
  Bell,
  UserCircle,
} from "lucide-react";

export interface ParentNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: "messages" | "notifications";
  requiredFeature?: MembershipFeature;
  requiredAnyFeatures?: MembershipFeature[];
}

export interface ParentNavGroup {
  title: string;
  items: ParentNavItem[];
}

export const parentNavGroups: ParentNavGroup[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/parent", icon: LayoutDashboard, requiredFeature: "parentDashboard" }],
  },
  {
    title: "Family",
    items: [
      { label: "My Children", href: "/parent/students", icon: Users, requiredFeature: "parentDashboard" },
      { label: "Assessments", href: "/parent/assessments", icon: ClipboardCheck, requiredFeature: "midTermAssessment" },
      { label: "Attendance", href: "/parent/attendance", icon: CalendarDays, requiredFeature: "parentDashboard" },
    ],
  },
  {
    title: "Learning",
    items: [
      { label: "Courses & Resources", href: "/parent/portfolio", icon: FolderOpen, requiredFeature: "digitalResourceLibrary" },
      { label: "My Books", href: "/parent/books", icon: BookOpen, requiredFeature: "monthlyBook" },
    ],
  },
  {
    title: "Communication",
    items: [
      { label: "Messages", href: "/parent/messages", icon: MessagesSquare, badgeKey: "messages", requiredFeature: "parentDashboard" },
      {
        label: "Tutors & Staff",
        href: "/parent/tutors",
        icon: GraduationCap,
        requiredAnyFeatures: ["tutoringSession30", "tutoringSession60"],
      },
      { label: "Notifications", href: "/parent/notifications", icon: Bell, badgeKey: "notifications", requiredFeature: "communityAnnouncements" },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Payments & Receipts", href: "/parent/receipts", icon: Receipt, requiredFeature: "parentDashboard" },
      { label: "Billing & Subscription", href: "/parent/billing", icon: CreditCard },
      { label: "My Profile", href: "/parent/account", icon: UserCircle, requiredFeature: "parentDashboard" },
    ],
  },
];

export const PARENT_NAV_ITEMS = parentNavGroups.flatMap((g) => g.items);

export const PORTFOLIO_NAV_ITEMS = [
  { href: "/parent/portfolio", label: "Overview" },
  { href: "/parent/portfolio/work-samples", label: "Documents" },
  { href: "/parent/portfolio/progress", label: "Progress" },
  { href: "/parent/portfolio/reading", label: "Reading & Resources" },
  { href: "/parent/portfolio/activities", label: "Activities" },
  { href: "/parent/portfolio/attendance", label: "Instruction Days" },
  { href: "/parent/portfolio/curriculum", label: "Curriculum" },
  { href: "/parent/portfolio/reviews", label: "Reviews" },
  { href: "/parent/portfolio/export", label: "Download & Export" },
] as const;
