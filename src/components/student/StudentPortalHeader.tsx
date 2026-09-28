"use client";

import { PortalWelcomeHeading } from "@/components/account/PortalWelcomeHeading";

export function StudentPortalHeader({
  fullName,
  firstName,
  initialAvatar,
  signOutAction,
}: {
  fullName: string;
  firstName: string;
  initialAvatar?: string | null;
  signOutAction: () => Promise<void>;
}) {
  return (
    <header className="shrink-0 border-b border-explore-charcoal/10 bg-white">
      <div className="mx-auto flex w-full min-w-0 max-w-7xl items-center justify-between px-3 py-4 sm:px-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-explore-teal">Student Portal</p>
          <PortalWelcomeHeading
            name={fullName}
            initialAvatar={initialAvatar}
            greeting={`Welcome, ${firstName}`}
            titleClassName="text-xl"
          />
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-lg px-3 py-1.5 text-sm text-explore-charcoal/70 hover:bg-explore-sand"
          >
            Sign Out
          </button>
        </form>
      </div>
    </header>
  );
}
