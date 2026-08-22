import { Suspense } from "react";
import { ParentSidebar } from "@/components/parent/ParentSidebar";
import { ParentHeader } from "@/components/parent/ParentHeader";

interface ParentShellProps {
  children: React.ReactNode;
  firstName: string;
  guardianId?: string;
  unreadMessages?: number;
  unreadNotifications?: number;
  navGroups: import("@/lib/parent/nav").ParentNavGroup[];
  signOutAction: () => Promise<void>;
}

export function ParentShell({
  children,
  firstName,
  guardianId,
  unreadMessages,
  unreadNotifications,
  navGroups,
  signOutAction,
}: ParentShellProps) {
  return (
    <div className="fixed inset-0 z-[100] flex h-dvh overflow-hidden bg-gray-50">
      <Suspense fallback={null}>
        <ParentSidebar
          guardianId={guardianId}
          unreadMessages={unreadMessages}
          unreadNotifications={unreadNotifications}
          navGroups={navGroups}
        />
      </Suspense>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <ParentHeader firstName={firstName} signOutAction={signOutAction} />
        <main
          id="parent-main-scroll"
          className="min-h-0 flex-1 overflow-x-clip overflow-y-auto overscroll-y-contain bg-gray-50 p-4 lg:p-6"
          data-lenis-prevent
        >
          <div className="mx-auto w-full min-w-0 max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
