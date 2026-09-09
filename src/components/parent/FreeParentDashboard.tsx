import Link from "next/link";
import { BookOpen, Library, MessagesSquare, UserCircle, Receipt } from "lucide-react";
import { UpgradeBanner } from "@/components/parent/UpgradeBanner";

interface FreeParentDashboardProps {
  firstName: string;
  orderCount: number;
  unreadMessages: number;
  showUpgradePrompt?: boolean;
}

const quickLinks = [
  {
    href: "/parent/books",
    label: "My Books",
    description: "Download purchased books and view order history",
    icon: BookOpen,
  },
  {
    href: "/parent/courses",
    label: "My Courses",
    description: "Access courses you have enrolled in or purchased",
    icon: Library,
  },
  {
    href: "/parent/messages",
    label: "Message Staff",
    description: "Contact Explore More Academy staff",
    icon: MessagesSquare,
  },
  {
    href: "/parent/account",
    label: "My Profile",
    description: "Update your name, address, phone, and password",
    icon: UserCircle,
  },
  {
    href: "/parent/receipts",
    label: "Payments & Receipts",
    description: "View receipts for your purchases",
    icon: Receipt,
  },
];

export function FreeParentDashboard({
  firstName,
  orderCount,
  unreadMessages,
  showUpgradePrompt,
}: FreeParentDashboardProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-explore-charcoal">
          Welcome back, {firstName}
        </h1>
        <p className="mt-2 text-explore-charcoal/70">
          Your free account gives you access to purchased books and courses, staff messaging, and
          your profile.
        </p>
      </div>

      <UpgradeBanner showUpgradePrompt={showUpgradePrompt} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-2xl border border-explore-charcoal/10 bg-white p-5 shadow-sm transition hover:border-explore-teal/30 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="rounded-xl bg-explore-teal/10 p-3 text-explore-teal">
                <item.icon className="h-6 w-6" />
              </div>
              {item.href === "/parent/messages" && unreadMessages > 0 && (
                <span className="rounded-full bg-explore-orange px-2 py-0.5 text-xs font-semibold text-white">
                  {unreadMessages}
                </span>
              )}
            </div>
            <h2 className="mt-4 font-display text-lg font-bold text-explore-charcoal group-hover:text-explore-teal">
              {item.label}
            </h2>
            <p className="mt-1 text-sm text-explore-charcoal/65">{item.description}</p>
          </Link>
        ))}
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm border border-explore-charcoal/8">
        <h3 className="font-display text-lg font-bold text-explore-charcoal">Shop &amp; enroll</h3>
        <p className="mt-2 text-sm text-explore-charcoal/70">
          Browse our bookstore and courses — your purchases will appear here automatically when you
          use the same email at checkout.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/books"
            className="rounded-xl bg-explore-teal px-4 py-2 text-sm font-semibold text-white hover:bg-explore-teal/90"
          >
            Browse Books
          </Link>
          <Link
            href="/courses"
            className="rounded-xl border border-explore-charcoal/15 px-4 py-2 text-sm font-semibold hover:bg-explore-sand"
          >
            Browse Courses
          </Link>
          <Link
            href="/parent/billing"
            className="rounded-xl border border-explore-charcoal/15 px-4 py-2 text-sm font-semibold hover:bg-explore-sand"
          >
            Billing &amp; Upgrade
          </Link>
        </div>
        {orderCount > 0 && (
          <p className="mt-4 text-sm text-explore-charcoal/60">
            You have {orderCount} completed order{orderCount === 1 ? "" : "s"} on file.
          </p>
        )}
      </div>
    </div>
  );
}
