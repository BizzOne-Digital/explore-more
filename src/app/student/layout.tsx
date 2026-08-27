import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getStudentMembershipAccess } from "@/lib/membership/access";
import {
  filterStudentNavForMembership,
  STUDENT_NAV_ITEMS,
} from "@/lib/membership/nav-filter";
import { getRequiredFeatureForStudentPath } from "@/lib/membership/route-features";

export const dynamic = "force-dynamic";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/student-portal");

  const isAdmin = session.user.role === "administrator";

  if (!isAdmin) {
    if (session.user.role !== "student") {
      redirect("/membership?reason=student-portal");
    }

    try {
      const gateAccess = await getStudentMembershipAccess(session.user.id);
      if (!gateAccess.hasActiveMembership) {
        redirect("/membership?reason=student-portal");
      }
    } catch (error) {
      console.error("Student membership access check failed:", error);
      redirect("/membership?reason=student-portal");
    }
  }

  const pathname = (await headers()).get("x-pathname") ?? "/student";
  const access = isAdmin
    ? {
        hasActiveMembership: true,
        tierId: "legacy" as const,
        planName: "Administrator",
        planSlug: null,
        features: [] as import("@/lib/membership/entitlements").MembershipFeature[],
        hasFeature: () => true,
      }
    : await getStudentMembershipAccess(session.user.id);

  if (!isAdmin && access.hasActiveMembership) {
    const required = getRequiredFeatureForStudentPath(pathname);
    if (required && !access.hasFeature(required)) {
      redirect("/student?upgrade=1");
    }
  }

  const navItems = isAdmin ? STUDENT_NAV_ITEMS : filterStudentNavForMembership(access.features);

  return (
    <div className="fixed inset-0 z-[100] flex h-dvh flex-col overflow-hidden bg-explore-cream">
      <header className="shrink-0 border-b border-explore-charcoal/10 bg-white">
        <div className="mx-auto flex w-full min-w-0 max-w-7xl items-center justify-between px-3 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-explore-teal">
              Student Portal
            </p>
            <h1 className="font-display text-xl text-explore-charcoal">
              Welcome, {session.user.name}
            </h1>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button
              type="submit"
              className="rounded-lg px-3 py-1.5 text-sm text-explore-charcoal/70 hover:bg-explore-sand"
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto flex min-h-0 w-full min-w-0 max-w-7xl flex-1 flex-col gap-6 overflow-hidden px-3 py-6 sm:px-6 lg:flex-row">
        <nav className="shrink-0 lg:w-56">
          <ul className="flex flex-wrap gap-2 lg:flex-col">
            {navItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-lg px-3 py-2 text-sm font-medium text-explore-charcoal hover:bg-explore-sand"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
