"use client";

import Link from "next/link";
import {
  getAdminUserDisplayId,
  getAdminUserProfileHref,
  type AdminUserIdFields,
} from "@/lib/admin/user-display-id";

export function AdminUserIdLink({ user }: { user: AdminUserIdFields }) {
  const { label, value } = getAdminUserDisplayId(user);
  const href = getAdminUserProfileHref(user);
  const isPrimaryId = label !== "Internal reference";

  return (
    <Link
      href={href}
      className={`font-mono text-xs hover:underline ${
        isPrimaryId ? "text-explore-teal" : "text-white/40"
      }`}
      title={`${label} — open profile`}
    >
      {value}
    </Link>
  );
}
