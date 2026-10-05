"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { GraduationCap } from "lucide-react";

export function EducationalChatWidget() {
  const pathname = usePathname();
  if (pathname?.startsWith("/learning-assistant")) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[200] sm:bottom-6 sm:right-6">
      <Link
        href="/learning-assistant"
        className="pointer-events-auto flex items-center gap-2 rounded-full bg-explore-teal px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-explore-teal/30 transition hover:bg-teal-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-explore-lime focus-visible:ring-offset-2"
      >
        <GraduationCap className="h-5 w-5" aria-hidden />
        <span className="hidden sm:inline">Ask a learning question</span>
        <span className="sm:hidden">Learn</span>
      </Link>
    </div>
  );
}
