import Link from "next/link";
import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TUTOR_PORTAL_ROLES } from "@/lib/constants";
import {
  BookOpen,
  Calendar,
  ChartLine,
  ClipboardCheck,
  MessageSquare,
  Users,
} from "lucide-react";
import { getTutorDashboardStats, getTutorProfile } from "@/lib/tutor/queries";

export const dynamic = "force-dynamic";

const QUICK_LINKS = [
  { href: "/tutor/classroom", label: "My Classroom", icon: Users },
  { href: "/tutor/planner", label: "Teacher Planner", icon: Calendar },
  { href: "/tutor/attendance", label: "Attendance", icon: ClipboardCheck },
  { href: "/tutor/gradebook", label: "Gradebook", icon: ChartLine },
  { href: "/tutor/todos", label: "To-Do List", icon: ClipboardCheck, key: "workspace" as const, statKey: "openTodos" as const },
  { href: "/tutor/checkout", label: "End-of-Day Check-Out", icon: Calendar },
  { href: "/tutor/messages", label: "Parent Messages", icon: MessageSquare, key: "unreadParentMessages" as const },
  { href: "/tutor/resources", label: "Resource Library", icon: BookOpen },
];

export default async function TutorDashboardPage() {
  const session = await auth();
  if (
    !session?.user ||
    !TUTOR_PORTAL_ROLES.includes(session.user.role as (typeof TUTOR_PORTAL_ROLES)[number])
  ) {
    redirect("/tutor/login");
  }

  await connectDB();
  const [profile, stats] = await Promise.all([
    getTutorProfile(session.user.id),
    getTutorDashboardStats(session.user.id),
  ]);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-br from-violet-600 to-violet-800 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-violet-200">
          Explore More Academy Staff Portal
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold">Welcome, {profile?.name}</h2>
        <div className="mt-4 flex flex-wrap gap-4 text-sm text-violet-100">
          {profile?.tutorId && (
            <span>
              Staff ID: <strong className="font-mono text-white">{profile.tutorId}</strong>
            </span>
          )}
          <span>
            Status: <strong className="text-white">{profile?.isActive === false ? "Inactive" : "Active"}</strong>
          </span>
          <span>
            Assigned Students: <strong className="text-white">{stats.assignedStudents}</strong>
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Assigned Students", value: stats.assignedStudents },
          { label: "Open to-dos", value: stats.workspace.openTodos },
          { label: "Today’s planner blocks", value: stats.workspace.todayPlanner },
          { label: "Unread notifications", value: stats.unreadNotifications },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-3xl font-bold text-explore-charcoal">{item.value}</p>
            <p className="mt-1 text-sm text-gray-500">{item.label}</p>
          </div>
        ))}
      </div>

      <section>
        <h3 className="font-display text-xl font-bold text-explore-charcoal">Quick Actions</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_LINKS.map((link) => {
            const Icon = link.icon;
            let statValue: number | undefined;
            if ("statKey" in link && link.statKey) {
              statValue = stats.workspace[link.statKey];
            } else if ("key" in link && link.key === "unreadParentMessages") {
              statValue = stats.unreadParentMessages;
            }
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-violet-200 hover:shadow-md"
              >
                <div className="rounded-xl bg-violet-50 p-3 text-violet-700">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-explore-charcoal">{link.label}</p>
                  {statValue !== undefined && statValue > 0 && (
                    <p className="mt-1 text-sm text-explore-orange">{statValue} need attention</p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
