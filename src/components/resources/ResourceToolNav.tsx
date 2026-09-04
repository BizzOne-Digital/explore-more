"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { FileText, Award } from "lucide-react";

const PUBLIC_TOOLS = [
  { slug: "transcript", label: "Transcript Generator", icon: FileText },
  { slug: "certificate", label: "Certificate Generator", icon: Award },
] as const;

type ResourceToolNavProps = {
  /** Route prefix, e.g. `/resources` or `/parent/tools` */
  basePath?: string;
};

export function ResourceToolNav({ basePath = "/resources" }: ResourceToolNavProps) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap justify-center gap-2 sm:gap-3">
      {PUBLIC_TOOLS.map(({ slug, label, icon: Icon }) => {
        const href = `${basePath}/${slug}`;
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
