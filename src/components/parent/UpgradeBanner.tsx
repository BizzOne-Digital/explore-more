import Link from "next/link";
import { Sparkles } from "lucide-react";

interface UpgradeBannerProps {
  showUpgradePrompt?: boolean;
}

export function UpgradeBanner({ showUpgradePrompt }: UpgradeBannerProps) {
  return (
    <div className="mb-6 rounded-2xl border border-explore-teal/25 bg-gradient-to-r from-explore-teal/10 to-explore-lime/10 p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold text-explore-teal">
            <Sparkles className="h-4 w-4" />
            Free Account
          </p>
          <h2 className="mt-1 font-display text-lg font-bold text-explore-charcoal">
            {showUpgradePrompt
              ? "This feature requires a membership"
              : "Want the full homeschool experience?"}
          </h2>
          <p className="mt-1 text-sm text-explore-charcoal/70">
            {showUpgradePrompt
              ? "Upgrade to unlock portfolio tracking, student accounts, tutoring, resources, and more."
              : "Upgrade anytime for portfolio tools, student dashboards, tutoring, resources, and member events."}
          </p>
        </div>
        <Link
          href="/membership"
          className="inline-flex shrink-0 items-center justify-center rounded-xl bg-explore-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-explore-teal/90 transition-colors"
        >
          View Membership Plans
        </Link>
      </div>
    </div>
  );
}
