"use client";

import { signOut, useSession } from "next-auth/react";
import { getClientSignOutUrl } from "@/lib/app-url";
import { LogOut, User } from "lucide-react";

interface AdminHeaderProps {
  title?: string;
}

export function AdminHeader({ title }: AdminHeaderProps) {
  const { data: session } = useSession();

  return (
    <header className="flex shrink-0 items-center justify-between border-b border-white/10 bg-explore-black/40 px-4 py-3 backdrop-blur-sm lg:px-6">
      <div className="pl-10 lg:pl-0">
        {title && (
          <p className="text-sm font-medium text-white/50 lg:hidden">{title}</p>
        )}
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-white/70">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-explore-teal/20">
            <User className="h-4 w-4 text-explore-teal" />
          </div>
          <span className="hidden sm:inline">{session?.user?.name ?? "Admin"}</span>
        </div>
        <button
          type="button"
          onClick={() => signOut({ callbackUrl: getClientSignOutUrl("/admin/login") })}
          className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-white/60 transition hover:border-white/20 hover:text-white"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>
    </header>
  );
}
