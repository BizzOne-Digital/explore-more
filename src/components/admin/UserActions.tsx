"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Key, Trash2, UserX, UserCheck, Loader } from "lucide-react";

interface UserActionsProps {
  userId: string;
  userName: string;
  userEmail: string;
  isActive: boolean;
  isSelf: boolean;
}

export function UserActions({ userId, userName, userEmail, isActive, isSelf }: UserActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handlePasswordReset() {
    if (!confirm(`Send password reset email to ${userName} (${userEmail})?`)) {
      return;
    }

    setLoading("reset");

    try {
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to send password reset");
      }

      alert(`✅ Password reset email sent to ${userEmail}`);
    } catch (err) {
      alert(`❌ Error: ${err instanceof Error ? err.message : "Failed to send password reset"}`);
    } finally {
      setLoading(null);
    }
  }

  async function handleDeactivate() {
    const action = isActive ? "deactivate" : "activate";
    const actionText = isActive ? "Deactivate" : "Activate";

    if (!confirm(`${actionText} ${userName}'s account? ${isActive ? "They will not be able to log in." : "They will be able to log in again."}`)) {
      return;
    }

    setLoading(action);

    try {
      const response = await fetch(`/api/admin/users/${userId}/delete`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} user`);
      }

      alert(`✅ User account ${action}d successfully`);
      router.refresh();
    } catch (err) {
      alert(`❌ Error: ${err instanceof Error ? err.message : `Failed to ${action} user`}`);
    } finally {
      setLoading(null);
    }
  }

  async function handleDelete() {
    if (!confirm(`⚠️ DELETE ${userName}'s account permanently?\n\nThis action CANNOT be undone!\n\nType the user's email to confirm: ${userEmail}`)) {
      return;
    }

    const confirmation = prompt(`Type "${userEmail}" to confirm deletion:`);
    if (confirmation !== userEmail) {
      alert("❌ Email confirmation did not match. Deletion cancelled.");
      return;
    }

    setLoading("delete");

    try {
      const response = await fetch(`/api/admin/users/${userId}/delete`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to delete user");
      }

      alert(`✅ User account deleted successfully`);
      router.push("/admin/users");
      router.refresh();
    } catch (err) {
      alert(`❌ Error: ${err instanceof Error ? err.message : "Failed to delete user"}`);
    } finally {
      setLoading(null);
    }
  }

  if (isSelf) {
    return (
      <div className="rounded-lg bg-yellow-500/20 border border-yellow-500/30 p-4">
        <p className="text-sm text-yellow-300">
          ⚠️ You cannot modify your own account from this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-white/70 mb-3">Account Actions</h3>

      {/* Password Reset */}
      <button
        onClick={handlePasswordReset}
        disabled={!!loading}
        className="flex w-full items-center gap-3 rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-left text-sm text-white hover:bg-white/10 transition-colors disabled:opacity-50"
      >
        {loading === "reset" ? (
          <Loader className="h-5 w-5 animate-spin text-blue-400" />
        ) : (
          <Key className="h-5 w-5 text-blue-400" />
        )}
        <div>
          <p className="font-medium">Send Password Reset</p>
          <p className="text-xs text-white/60">Email a password reset link to this user</p>
        </div>
      </button>

      {/* Deactivate/Activate */}
      <button
        onClick={handleDeactivate}
        disabled={!!loading}
        className="flex w-full items-center gap-3 rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-left text-sm text-white hover:bg-white/10 transition-colors disabled:opacity-50"
      >
        {loading === "deactivate" || loading === "activate" ? (
          <Loader className="h-5 w-5 animate-spin text-yellow-400" />
        ) : isActive ? (
          <UserX className="h-5 w-5 text-yellow-400" />
        ) : (
          <UserCheck className="h-5 w-5 text-green-400" />
        )}
        <div>
          <p className="font-medium">{isActive ? "Deactivate" : "Activate"} Account</p>
          <p className="text-xs text-white/60">
            {isActive ? "Prevent user from logging in" : "Allow user to log in"}
          </p>
        </div>
      </button>

      {/* Delete Account */}
      <button
        onClick={handleDelete}
        disabled={!!loading}
        className="flex w-full items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-left text-sm text-white hover:bg-red-500/20 transition-colors disabled:opacity-50"
      >
        {loading === "delete" ? (
          <Loader className="h-5 w-5 animate-spin text-red-400" />
        ) : (
          <Trash2 className="h-5 w-5 text-red-400" />
        )}
        <div>
          <p className="font-medium text-red-300">Delete Account Permanently</p>
          <p className="text-xs text-red-400/80">
            ⚠️ This action cannot be undone
          </p>
        </div>
      </button>

      {/* Warning */}
      <div className="rounded-lg bg-yellow-500/10 border border-yellow-500/20 p-3 mt-4">
        <p className="text-xs text-yellow-300">
          <strong>⚠️ Important:</strong> Deactivating is safer than deleting. 
          Deleted accounts lose all data and cannot be recovered.
        </p>
      </div>
    </div>
  );
}
