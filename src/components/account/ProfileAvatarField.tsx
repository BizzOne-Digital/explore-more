"use client";

import { ClickableProfileAvatar } from "@/components/account/ClickableProfileAvatar";

export function ProfileAvatarField({
  initialAvatar,
  name,
}: {
  initialAvatar?: string | null;
  name: string;
}) {
  return (
    <div className="flex flex-wrap items-start gap-4">
      <ClickableProfileAvatar name={name} initialAvatar={initialAvatar} size="xl" />
      <div className="pt-1">
        <p className="text-sm font-medium text-explore-charcoal">Profile photo</p>
        <p className="mt-1 text-xs text-explore-charcoal/50">
          Click your photo or drag an image here to upload. JPG or PNG.
        </p>
      </div>
    </div>
  );
}
