import Link from "next/link";
import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TEACHER_PORTAL_ROLES } from "@/lib/constants";
import { getPrimarySchoolForTeacher } from "@/lib/teacher/school";
import { getTeacherWorkspaceDashboardStats } from "@/lib/tutor/workspace-stats";
import { ClipboardList, MessageSquare, Moon, School } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TeacherDashboardPage() {
  const session = await auth();
  if (
    !session?.user ||
    !TEACHER_PORTAL_ROLES.includes(session.user.role as (typeof TEACHER_PORTAL_ROLES)[number])
  ) {
    redirect("/tutor/login");
  }

  await connectDB();
  const schoolCtx = await getPrimarySchoolForTeacher(session.user.id);
  const workspace = await getTeacherWorkspaceDashboardStats(session.user.id);

  const quick = [
    { href: "/teacher/classroom", label: "My Classroom", icon: School },
    { href: "/teacher/planner", label: "Teacher Planner", icon: ClipboardList },
    { href: "/teacher/todos", label: "To-Do List", icon: ClipboardList, stat: workspace.openTodos },
    { href: "/teacher/checkout", label: "End-of-Day Check-Out", icon: Moon },
    { href: "/teacher/messages", label: "Colleague Messages", icon: MessageSquare },
  ];

  return (
    <div className="space-y-8">
      <div className="rounded-2xl bg-gradient-to-br from-teal-600 to-teal-800 p-6 text-white shadow-lg sm:p-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-teal-100">
          Teacher Portal — digital planner
        </p>
        <h2 className="mt-2 font-display text-3xl font-bold">Hello, {session.user.name}</h2>
        <p className="mt-2 max-w-2xl text-sm text-teal-50">
          This portal replaces a paper planner. It is separate from the Explore More{" "}
          <strong className="text-white">Tutor</strong> portal (assigned students & parent
          messaging).
        </p>
        {schoolCtx ? (
          <p className="mt-3 text-sm">
            School: <strong className="text-white">{schoolCtx.school.name}</strong>
          </p>
        ) : (
          <p className="mt-3 text-sm text-amber-100">
            Your account is not linked to a school yet — colleague messaging unlocks once
            administration registers your school.
          </p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Open to-dos", value: workspace.openTodos },
          { label: "Today’s planner blocks", value: workspace.todayPlanner },
          { label: "Lesson plans (7 days)", value: workspace.lessonPlansThisWeek },
          { label: "Checked out today", value: workspace.checkedOutToday ? 1 : 0 },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl bg-white p-5 shadow-sm">
            <p className="text-3xl font-bold text-explore-charcoal">{item.value}</p>
            <p className="mt-1 text-sm text-gray-500">{item.label}</p>
          </div>
        ))}
      </div>

      <section>
        <h3 className="font-display text-xl font-bold text-explore-charcoal">Quick actions</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quick.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:border-teal-200"
              >
                <div className="rounded-xl bg-teal-50 p-3 text-teal-700">
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-semibold text-explore-charcoal">{link.label}</p>
                  {link.stat !== undefined && link.stat > 0 && (
                    <p className="mt-1 text-sm text-explore-orange">{link.stat} open</p>
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
