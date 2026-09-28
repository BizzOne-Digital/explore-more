"use client";

import { PortalWelcomeHeading } from "@/components/account/PortalWelcomeHeading";

export function StaffPortalHeader({
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
    <header className="border-b border-explore-charcoal/10 bg-white">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-explore-teal">Staff Portal</p>
          <PortalWelcomeHeading
            name={fullName}
            initialAvatar={initialAvatar}
            greeting={`Welcome, ${firstName}`}
            titleClassName="text-lg font-bold"
          />
        </div>
        <form action={signOutAction}>
          <button
            type="submit"
            className="rounded-lg border border-explore-charcoal/20 px-3 py-1.5 text-sm font-semibold"
          >
            Sign out
          </button>
        </form>
      </div>
    </header>
  );
}
