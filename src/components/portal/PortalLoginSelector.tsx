import Link from "next/link";
import { GraduationCap, Users, Briefcase } from "lucide-react";
import { AuthFormShell } from "@/components/forms/AuthFormShell";

const PORTALS = [
  {
    key: "parent",
    emoji: "👨‍👩‍👧",
    title: "Parent",
    subtitle: "Take to Parent Portal",
    href: "/parent-portal",
    icon: Users,
    accent: "from-explore-teal/15 to-explore-teal/5 border-explore-teal/30",
  },
  {
    key: "student",
    emoji: "🎒",
    title: "Student",
    subtitle: "Take to Student Portal",
    href: "/student-portal",
    icon: GraduationCap,
    accent: "from-explore-orange/15 to-explore-orange/5 border-explore-orange/30",
  },
  {
    key: "staff",
    emoji: "🧑‍🏫",
    title: "Staff",
    subtitle: "Take to Staff Portal",
    href: "/tutor-portal",
    icon: Briefcase,
    accent: "from-violet-500/15 to-violet-500/5 border-violet-400/30",
  },
] as const;

export function PortalLoginSelector() {
  return (
    <AuthFormShell
      title="Portal Login"
      subtitle="Choose how you sign in. Each portal is designed for your role at Explore More Academy."
    >
      <div className="grid gap-4 sm:grid-cols-1">
        {PORTALS.map((portal) => {
          const Icon = portal.icon;
          return (
            <Link
              key={portal.key}
              href={portal.href}
              className={`group flex items-center gap-4 rounded-2xl border bg-gradient-to-br p-5 transition hover:shadow-md ${portal.accent}`}
            >
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm">
                <span aria-hidden>{portal.emoji}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-explore-charcoal/50">
                  {portal.title}
                </p>
                <p className="font-display text-lg font-bold text-explore-charcoal">
                  {portal.subtitle}
                </p>
                <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-explore-teal group-hover:underline">
                  Sign in
                  <Icon className="h-4 w-4" />
                </p>
              </div>
            </Link>
          );
        })}
      </div>
      <p className="text-center text-xs text-explore-charcoal/50">
        Front desk staff can use the{" "}
        <Link href="/staff/login" className="text-explore-teal hover:underline">
          Staff Messages
        </Link>{" "}
        portal for parent calls and inbox only.
      </p>
    </AuthFormShell>
  );
}
