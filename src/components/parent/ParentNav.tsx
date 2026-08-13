"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { PARENT_NAV_ITEMS } from "@/lib/parent/nav";

export function ParentSidebar({ unreadMessages = 0, unreadNotifications = 0 }: {
  unreadMessages?: number;
  unreadNotifications?: number;
}) {
  const pathname = usePathname();

  return (
    <nav className="lg:w-60 shrink-0">
      <ul className="flex flex-wrap gap-2 lg:flex-col lg:gap-1">
        {PARENT_NAV_ITEMS.map((item) => {
          const active =
            item.href === "/parent"
              ? pathname === "/parent"
              : pathname.startsWith(item.href);

          let badge = 0;
          if (item.href === "/parent/messages") badge = unreadMessages;
          if (item.href === "/parent/notifications") badge = unreadNotifications;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition",
                  active
                    ? "bg-explore-teal text-white"
                    : "text-explore-charcoal hover:bg-explore-sand"
                )}
              >
                <span>{item.label}</span>
                {badge > 0 && (
                  <span className="rounded-full bg-explore-orange px-2 py-0.5 text-xs font-semibold text-white">
                    {badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function PortfolioSubNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const suffix = query ? `?${query}` : "";

  const items = [
    { href: "/parent/portfolio", label: "Overview" },
    { href: "/parent/portfolio/work-samples", label: "Work Samples" },
    { href: "/parent/portfolio/progress", label: "Progress" },
    { href: "/parent/portfolio/reading", label: "Reading" },
    { href: "/parent/portfolio/activities", label: "Activities" },
    { href: "/parent/portfolio/attendance", label: "Attendance" },
    { href: "/parent/portfolio/curriculum", label: "Curriculum" },
    { href: "/parent/portfolio/reviews", label: "Reviews" },
    { href: "/parent/portfolio/export", label: "Export" },
  ];

  return (
    <div className="mb-6 flex flex-wrap gap-2 border-b border-explore-charcoal/10 pb-4">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={`${item.href}${suffix}`}
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-semibold transition",
              active
                ? "bg-explore-forest text-white"
                : "bg-explore-sand text-explore-charcoal/70 hover:bg-explore-charcoal/10"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
