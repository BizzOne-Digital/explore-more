"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  Award,
  BookOpen,
  Bus,
  Calendar,
  CircleHelp,
  ClipboardList,
  FileText,
  Flag,
  FolderOpen,
  GraduationCap,
  Home,
  Import,
  LayoutTemplate,
  LogOut,
  Menu,
  MessageSquare,
  MessageSquareQuote,
  Moon,
  Package,
  School,
  Settings,
  Shield,
  StickyNote,
  Target,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";
import { TEACHER_WORKSPACE_NAV, type TeacherNavIcon } from "@/lib/teacher/workspace-nav";
import { CopyIdButton } from "@/components/parent/CopyIdButton";

const ICONS: Record<TeacherNavIcon, React.ComponentType<{ className?: string }>> = {
  home: Home,
  calendar: Calendar,
  school: School,
  planner: ClipboardList,
  book: BookOpen,
  target: Target,
  clipboard: ClipboardList,
  gradebook: GraduationCap,
  test: FileText,
  flag: Flag,
  shield: Shield,
  note: StickyNote,
  folder: FolderOpen,
  box: Package,
  bus: Bus,
  substitute: Settings,
  report: FileText,
  file: FileText,
  award: Award,
  todo: ClipboardList,
  moon: Moon,
  archive: Archive,
  template: LayoutTemplate,
  import: Import,
  feedback: MessageSquareQuote,
  settings: Settings,
  message: MessageSquare,
  help: CircleHelp,
};

interface TeacherSidebarProps {
  staffId?: string;
  schoolName?: string;
  unreadColleagueMessages?: number;
  signOutAction: () => Promise<void>;
}

export function TeacherSidebar({
  staffId,
  schoolName,
  unreadColleagueMessages = 0,
  signOutAction,
}: TeacherSidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const isActive = (href: string) => {
    if (href === "/teacher") return pathname === "/teacher";
    return pathname.startsWith(href);
  };

  const navContent = (
    <div className="flex h-full flex-col">
      <div className="border-b border-gray-200 px-5 py-5">
        <Link href="/teacher" className="block" onClick={() => setOpen(false)}>
          <span className="font-display text-lg font-semibold text-explore-charcoal">
            Explore More
          </span>
          <span className="mt-0.5 block text-xs font-medium uppercase tracking-widest text-teal-700">
            Teacher Portal
          </span>
          {schoolName && (
            <span className="mt-1 block text-xs text-gray-500 truncate">{schoolName}</span>
          )}
        </Link>
      </div>

      <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4" data-lenis-prevent>
        {TEACHER_WORKSPACE_NAV.map((group) => (
          <div key={group.title} className="mb-4 last:mb-0">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {group.title}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const Icon = ICONS[item.icon] ?? Home;
                const active = isActive(item.href);
                const badge =
                  item.href === "/teacher/messages" ? unreadColleagueMessages : 0;

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition",
                        active
                          ? "bg-teal-50 text-teal-900"
                          : "text-gray-600 hover:bg-gray-50 hover:text-explore-charcoal"
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="flex-1 leading-snug">{item.label}</span>
                      {badge > 0 && (
                        <span className="rounded-full bg-explore-orange px-2 py-0.5 text-[10px] font-semibold text-white">
                          {badge > 99 ? "99+" : badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t border-gray-200 px-5 py-4">
        {staffId ? (
          <div className="rounded-lg bg-teal-50 px-3 py-2.5">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-teal-800/70">
              Staff ID
            </p>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="font-mono text-sm font-semibold text-explore-charcoal">
                {staffId}
              </span>
              <CopyIdButton value={staffId} label="" variant="light" />
            </div>
          </div>
        ) : null}

        <form action={signOutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </div>
    </div>
  );

  return (
    <>
      {!open && (
        <button
          type="button"
          className="fixed left-3 top-3 z-[120] rounded-lg border border-gray-200 bg-white p-2 shadow lg:hidden"
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      )}

      <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:block">{navContent}</aside>

      {open && (
        <div className="fixed inset-0 z-[130] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          />
          <aside className="relative h-full w-72 max-w-[85vw] bg-white shadow-xl">
            <button
              type="button"
              className="absolute right-3 top-3 z-10 rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
