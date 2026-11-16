"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader, Trash2 } from "lucide-react";

interface DeleteUserButtonProps {
  userId: string;
  userName: string;
  /** "icon" for table rows, "button" for page headers. */
  variant?: "icon" | "button";
  /** Where to go after deleting. If omitted, the current page is refreshed. */
  redirectTo?: string;
}

export function DeleteUserButton({
  userId,
  userName,
  variant = "button",
  redirectTo,
}: DeleteUserButtonProps) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = confirm(
      `Permanently delete ${userName}?\n\nThis removes the account and its profile and links. Orders and donations are kept for records. This cannot be undone.\n\nTo keep the data, use Deactivate instead.`
    );
    if (!confirmed) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      const json = await res.json().catch(() => null);

      if (!res.ok || json?.success === false) {
        alert(json?.error || "Failed to delete user");
        return;
      }

      if (redirectTo) {
        router.push(redirectTo);
      }
      router.refresh();
    } catch {
      alert("Failed to delete user");
    } finally {
      setDeleting(false);
    }
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        onClick={handleDelete}
        disabled={deleting}
        title={`Delete ${userName}`}
        aria-label={`Delete ${userName}`}
        className="rounded-lg p-2 text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
      >
        {deleting ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition hover:bg-red-500/20 disabled:opacity-50"
    >
      {deleting ? <Loader className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
      Delete
    </button>
  );
}
