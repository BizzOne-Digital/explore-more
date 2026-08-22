import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

const navItems = [
  { href: "/student", label: "Dashboard" },
  { href: "/student/courses", label: "My Courses" },
  { href: "/student/programs", label: "Programs" },
  { href: "/student/results", label: "Results" },
  { href: "/student/events", label: "Events" },
  { href: "/student/certificates", label: "My Certificates" },
  { href: "/student/resources", label: "Resources" },
  { href: "/student/messages", label: "Messages" },
  { href: "/student/profile", label: "Profile" },
];

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/student");

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-explore-cream">
      <div className="border-b border-explore-charcoal/10 bg-explore-white">
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
      </div>

      <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-6 px-3 py-8 sm:px-6 lg:flex-row">
        <nav className="lg:w-56 shrink-0">
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
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
