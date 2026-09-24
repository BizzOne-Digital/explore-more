import { TeacherSidebar } from "@/components/teacher/TeacherSidebar";

interface TeacherShellProps {
  children: React.ReactNode;
  firstName: string;
  staffId?: string;
  schoolName?: string;
  unreadColleagueMessages?: number;
  signOutAction: () => Promise<void>;
}

export function TeacherShell({
  children,
  firstName,
  staffId,
  schoolName,
  unreadColleagueMessages,
  signOutAction,
}: TeacherShellProps) {
  return (
    <div className="fixed inset-0 z-[100] flex h-dvh overflow-hidden bg-gray-50">
      <TeacherSidebar
        staffId={staffId}
        schoolName={schoolName}
        unreadColleagueMessages={unreadColleagueMessages}
        signOutAction={signOutAction}
      />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <header className="border-b border-gray-200 bg-white px-3 py-2.5 sm:px-4 lg:px-6 lg:py-4">
          <div className="pl-11 lg:pl-0">
            <p className="text-sm text-gray-500">Welcome back,</p>
            <h1 className="font-display text-xl font-bold text-explore-charcoal">{firstName}</h1>
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
