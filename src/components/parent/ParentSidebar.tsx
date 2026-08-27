"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { parentNavGroups } from "@/lib/parent/nav";
import { filterParentNavForMembership } from "@/lib/membership/nav-filter";
import type { MembershipFeature } from "@/lib/membership/entitlements";
import { CopyIdButton } from "@/components/parent/CopyIdButton";

interface ParentSidebarProps {
  guardianId?: string;
  unreadMessages?: number;
  unreadNotifications?: number;
  showAllNav?: boolean;
  membershipFeatures?: MembershipFeature[];
}

export function ParentSidebar({
  guardianId,
  unreadMessages = 0,
  unreadNotifications = 0,
  showAllNav = false,
  membershipFeatures = [],
}: ParentSidebarProps) {
  const navGroups = showAllNav
    ? parentNavGroups
    : filterParentNavForMembership(membershipFeatures);
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const badges = {
    messages: unreadMessages,
    notifications: unreadNotifications,
  };

  const isActive = (href: string) => {
    if (href === "/parent") return pathname === "/parent";
    return pathname.startsWith(href);
  };

  const navContent = (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 px-5 py-5">
        <Link href="/parent" className="block" onClick={() => setOpen(false)}>
          <span className="font-display text-lg font-semibold text-explore-charcoal">
            Explore More
          </span>
          <span className="mt-0.5 block text-xs font-medium uppercase tracking-widest text-explore-teal">
            Parent Portal
          </span>
        </Link>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 py-4" data-lenis-prevent>
        {navGroups.map((group) => (
          <div key={group.title} className="mb-5">
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                const badge = item.badgeKey ? badges[item.badgeKey] : 0;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                        active
                          ? "bg-explore-teal/10 text-explore-teal"
                          : "text-gray-600 hover:bg-gray-50 hover:text-explore-charcoal"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{item.label}</span>
                      {badge > 0 && (
                        <span className="rounded-full bg-explore-orange px-2 py-0.5 text-[10px] font-semibold text-white">
                          {badge > 99 ? "99+" : badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t border-gray-200 px-5 py-4">
        {guardianId ? (
          <div className="rounded-lg bg-gray-50 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
              Guardian ID
            </p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-semibold text-explore-charcoal">{guardianId}</span>
              <CopyIdButton value={guardianId} label="" variant="light" />
            </div>
          </div>
        ) : null}
        <Link
          href="/"
          className="text-xs text-gray-400 transition hover:text-explore-teal"
        >
          ← Back to website
        </Link>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-lg border border-gray-200 bg-white p-2 text-explore-charcoal shadow-sm lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-gray-200 bg-white shadow-xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-gray-400 hover:text-explore-charcoal"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {navContent}
          </aside>
        </div>
      )}

      <aside className="hidden h-full min-h-0 w-64 shrink-0 border-r border-gray-200 bg-white lg:block">
        {navContent}
      </aside>
    </>
  );
}
