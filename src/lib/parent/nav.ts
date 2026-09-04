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
  NotebookPen,
  Library,
  Award,
  FileText,
  ScrollText,
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
      { label: "Certificates", href: "/parent/certificates", icon: Award, requiredFeature: "parentDashboard" },
    ],
  },
  {
    title: "Learning",
    items: [
      { label: "My Courses", href: "/parent/courses", icon: Library, requiredFeature: "parentDashboard" },
      { label: "My Resources", href: "/parent/resources", icon: FolderOpen, requiredFeature: "digitalResourceLibrary" },
      { label: "My Books", href: "/parent/books", icon: BookOpen, requiredFeature: "monthlyBook" },
      { label: "Portfolio", href: "/parent/portfolio", icon: NotebookPen, requiredFeature: "parentDashboard" },
      { label: "Transcript Generator", href: "/parent/tools/transcript", icon: FileText },
      { label: "Certificate Generator", href: "/parent/tools/certificate", icon: ScrollText },
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
        requiredFeature: "parentDashboard",
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
