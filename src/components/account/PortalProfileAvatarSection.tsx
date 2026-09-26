"use client";

import { ProfileAvatarField } from "@/components/account/ProfileAvatarField";

export function PortalProfileAvatarSection({
  name,
  initialAvatar,
}: {
  name: string;
  initialAvatar?: string | null;
}) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="text-sm font-semibold text-explore-charcoal">Profile photo</h3>
      <p className="mt-1 text-xs text-gray-500">Optional — helps colleagues and parents recognize you.</p>
      <div className="mt-4">
        <ProfileAvatarField name={name} initialAvatar={initialAvatar} />
      </div>
    </div>
  );
}
