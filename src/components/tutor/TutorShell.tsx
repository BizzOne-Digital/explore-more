import { TutorSidebar } from "@/components/tutor/TutorSidebar";

interface TutorShellProps {
  children: React.ReactNode;
  firstName: string;
  tutorId?: string;
  unreadParentMessages?: number;
  unreadStaffMessages?: number;
  unreadNotifications?: number;
  signOutAction: () => Promise<void>;
}

export function TutorShell({
  children,
  firstName,
  tutorId,
  unreadParentMessages,
  unreadStaffMessages,
  unreadNotifications,
  signOutAction,
}: TutorShellProps) {
  return (
    <div className="fixed inset-0 z-[100] flex h-dvh overflow-hidden bg-gray-50">
      <TutorSidebar
        tutorId={tutorId}
        unreadParentMessages={unreadParentMessages}
        unreadStaffMessages={unreadStaffMessages}
        unreadNotifications={unreadNotifications}
        signOutAction={signOutAction}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="border-b border-gray-200 bg-white px-4 py-4 lg:px-6">
          <p className="text-sm text-gray-500">Welcome back,</p>
          <h1 className="font-display text-xl font-bold text-explore-charcoal">{firstName}</h1>
        </header>
        <main
          className="min-h-0 flex-1 overflow-x-clip overflow-y-auto bg-gray-50 p-4 lg:p-6"
          data-lenis-prevent
        >
          <div className="mx-auto w-full min-w-0 max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
