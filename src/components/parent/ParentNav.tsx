"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { cn } from "@/lib/cn";
import { PORTFOLIO_NAV_ITEMS } from "@/lib/parent/nav";

export function PortfolioSubNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const query = searchParams.toString();
  const suffix = query ? `?${query}` : "";

  return (
    <div className="mb-6 flex flex-wrap gap-2 rounded-xl border border-gray-200 bg-white p-2">
      {PORTFOLIO_NAV_ITEMS.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={`${item.href}${suffix}`}
            className={cn(
              "rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              active
                ? "bg-explore-teal text-white"
                : "text-gray-600 hover:bg-gray-100 hover:text-explore-charcoal"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
