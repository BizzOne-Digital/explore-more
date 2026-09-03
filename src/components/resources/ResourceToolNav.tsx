"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { FileText, Award } from "lucide-react";

const TOOLS = [
  { href: "/resources/transcript", label: "Transcript Generator", icon: FileText },
  { href: "/resources/certificate", label: "Certificate Generator", icon: Award },
] as const;

export function ResourceToolNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap justify-center gap-2 sm:gap-3">
      {TOOLS.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors",
              active
                ? "border-explore-teal bg-explore-teal text-white shadow-sm"
                : "border-explore-charcoal/15 bg-white text-explore-charcoal hover:border-explore-teal/40 hover:text-explore-teal"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
