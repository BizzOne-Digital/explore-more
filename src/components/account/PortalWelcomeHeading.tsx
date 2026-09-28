"use client";

import { ClickableProfileAvatar } from "@/components/account/ClickableProfileAvatar";

type PortalWelcomeHeadingProps = {
  name: string;
  initialAvatar?: string | null;
  /** e.g. "Welcome, Alex" or "Welcome back, Alex" */
  greeting: string;
  className?: string;
  titleClassName?: string;
  subtitle?: React.ReactNode;
  avatarSize?: "sm" | "md" | "lg";
};

export function PortalWelcomeHeading({
  name,
  initialAvatar,
  greeting,
  className = "",
  titleClassName = "",
  subtitle,
  avatarSize = "md",
}: PortalWelcomeHeadingProps) {
  return (
    <div className={`flex min-w-0 items-center gap-3 ${className}`}>
      <ClickableProfileAvatar name={name} initialAvatar={initialAvatar} size={avatarSize} />
      <div className="min-w-0">
        {subtitle}
        <h1 className={`truncate font-display text-explore-charcoal ${titleClassName}`}>{greeting}</h1>
      </div>
    </div>
  );
}
