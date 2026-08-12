import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FileText,
  Calendar,
  ClipboardList,
  BookOpen,
  ShoppingCart,
  GraduationCap,
  UserCheck,
  Compass,
  Inbox,
  Heart,
  DollarSign,
  Users,
  Trophy,
  CalendarCheck,
  Award,
  UserCog,
  Images,
  MessageSquareQuote,
  HelpCircle,
  Mail,
  MessagesSquare,
  Bell,
  Settings,
} from "lucide-react";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    title: "Overview",
    items: [{ label: "Dashboard", href: "/admin", icon: LayoutDashboard }],
  },
  {
    title: "Content",
    items: [{ label: "Pages", href: "/admin/pages", icon: FileText }],
  },
  {
    title: "Events",
    items: [
      { label: "Events", href: "/admin/events", icon: Calendar },
      { label: "Registrations", href: "/admin/event-registrations", icon: ClipboardList },
    ],
  },
  {
    title: "Books",
    items: [
      { label: "Books", href: "/admin/books", icon: BookOpen },
      { label: "Orders", href: "/admin/orders", icon: ShoppingCart },
    ],
  },
  {
    title: "Courses",
    items: [
      { label: "Courses", href: "/admin/courses", icon: GraduationCap },
      { label: "Enrollments", href: "/admin/enrollments", icon: UserCheck },
    ],
  },
  {
    title: "Programs",
    items: [
      { label: "Programs", href: "/admin/programs", icon: Compass },
      { label: "Service Requests", href: "/admin/service-requests", icon: Inbox },
    ],
  },
  {
    title: "Donations",
    items: [
      { label: "Campaigns", href: "/admin/campaigns", icon: Heart },
      { label: "Donations", href: "/admin/donations", icon: DollarSign },
    ],
  },
  {
    title: "Students",
    items: [
      { label: "Students", href: "/admin/students", icon: Users },
      { label: "Results", href: "/admin/results", icon: Trophy },
      { label: "Attendance", href: "/admin/attendance", icon: CalendarCheck },
      { label: "Certificates", href: "/admin/certificates", icon: Award },
    ],
  },
  {
    title: "People",
    items: [{ label: "Users", href: "/admin/users", icon: UserCog }],
  },
  {
    title: "Media & FAQs",
    items: [
      { label: "Gallery", href: "/admin/gallery", icon: Images },
      { label: "Testimonials", href: "/admin/testimonials", icon: MessageSquareQuote },
      { label: "FAQs", href: "/admin/faqs", icon: HelpCircle },
    ],
  },
  {
    title: "Communications",
    items: [
      { label: "Email Campaigns", href: "/admin/email-campaigns", icon: Mail },
      { label: "Messages", href: "/admin/messages", icon: MessagesSquare },
      { label: "Subscribers", href: "/admin/subscribers", icon: Bell },
    ],
  },
  {
    title: "System",
    items: [{ label: "Settings", href: "/admin/settings", icon: Settings }],
  },
];

export const adminNavItems = adminNavGroups.flatMap((g) => g.items);
