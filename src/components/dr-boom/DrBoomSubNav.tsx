"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/dr-boom", label: "Meet Dr. Boom", match: "exact" as const },
  { href: "/dr-boom#show", label: "The Show", match: "hash" as const, hash: "show" },
  { href: "/dr-boom#experiments", label: "Experiments", match: "hash" as const, hash: "experiments" },
  { href: "/dr-boom#faq", label: "FAQ", match: "hash" as const, hash: "faq" },
  { href: "/dr-boom/book", label: "Book Dr. Boom", match: "book" as const },
];

export function DrBoomSubNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky top-[72px] z-40 border-b border-explore-lime/20 bg-explore-black/95 backdrop-blur-md"
      aria-label="Dr. Boom navigation"
    >
      <div className="mx-auto flex w-full max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 sm:gap-2 sm:px-6">
        {LINKS.map((link) => {
          const isBook = link.match === "book" && pathname === "/dr-boom/book";
          const isExact = link.match === "exact" && pathname === "/dr-boom";
          const active = isBook || isExact;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "shrink-0 rounded-full px-3 py-1.5 text-xs font-bold uppercase tracking-wide transition sm:px-4 sm:text-sm",
                active
                  ? "bg-explore-lime text-explore-black"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
