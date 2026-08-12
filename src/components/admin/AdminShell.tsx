"use client";

import { usePathname } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/admin/login";

  if (isLogin) {
    return <>{children}</>;
  }

  return (
    <div className="fixed inset-0 z-[100] flex h-dvh overflow-hidden bg-explore-black">
      <AdminSidebar />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AdminHeader />
        <main
          id="admin-main-scroll"
          className="min-h-0 flex-1 overflow-x-clip overflow-y-auto overscroll-y-contain p-4 lg:p-6"
          data-lenis-prevent
        >
          {children}
        </main>
      </div>
    </div>
  );
}
