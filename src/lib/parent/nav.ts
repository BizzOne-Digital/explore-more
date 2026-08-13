export const PARENT_NAV_ITEMS = [
  { href: "/parent", label: "Dashboard", icon: "dashboard" },
  { href: "/parent/students", label: "My Students", icon: "students" },
  { href: "/parent/portfolio", label: "Homeschool Portfolio", icon: "portfolio" },
  { href: "/parent/messages", label: "Messages", icon: "messages" },
  { href: "/parent/tutors", label: "Tutors & Staff", icon: "tutors" },
  { href: "/parent/receipts", label: "Receipts & Purchases", icon: "receipts" },
  { href: "/parent/notifications", label: "Notifications", icon: "notifications" },
  { href: "/parent/account", label: "Account", icon: "account" },
] as const;

export const PORTFOLIO_NAV_ITEMS = [
  { href: "/parent/portfolio", label: "Overview" },
  { href: "/parent/portfolio/work-samples", label: "Work Samples" },
  { href: "/parent/portfolio/progress", label: "Progress Markers" },
  { href: "/parent/portfolio/reading", label: "Reading & Resources" },
  { href: "/parent/portfolio/activities", label: "Activity Logs" },
  { href: "/parent/portfolio/attendance", label: "Attendance" },
  { href: "/parent/portfolio/curriculum", label: "Curriculum" },
  { href: "/parent/portfolio/reviews", label: "Portfolio Reviews" },
  { href: "/parent/portfolio/export", label: "Download & Export" },
] as const;
