export const PARENT_NAV_ITEMS = [
  { href: "/parent", label: "Dashboard", icon: "dashboard" },
  { href: "/parent/students", label: "My Children", icon: "students" },
  { href: "/parent/attendance", label: "Attendance", icon: "attendance" },
  { href: "/parent/portfolio", label: "Courses & Resources", icon: "portfolio" },
  { href: "/parent/messages", label: "Messages", icon: "messages" },
  { href: "/parent/tutors", label: "Tutors & Staff", icon: "messages" },
  { href: "/parent/books", label: "My Books", icon: "portfolio" },
  { href: "/parent/receipts", label: "Payments & Receipts", icon: "receipts" },
  { href: "/parent/billing", label: "Billing & Subscription", icon: "billing" },
  { href: "/parent/notifications", label: "Notifications", icon: "notifications" },
  { href: "/parent/account", label: "My Profile", icon: "account" },
] as const;

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
