import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { STAFF_PORTAL_ROLES } from "@/lib/constants";
import { Conversation } from "@/models";
import Link from "next/link";
import { signOut } from "@/lib/auth";
import { STAFF_NAV_ITEMS } from "@/lib/staff/nav";

export const dynamic = "force-dynamic";

async function getUnreadCount(userId: string) {
  await connectDB();
  return Conversation.countDocuments({ staffId: userId, staffUnread: { $gt: 0 } });
}

export default async function StaffPortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user || !STAFF_PORTAL_ROLES.includes(session.user.role as (typeof STAFF_PORTAL_ROLES)[number])) {
    redirect("/staff/login");
  }

  const unread = await getUnreadCount(session.user.id);

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-explore-cream">
      <header className="border-b border-explore-charcoal/10 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-explore-teal">
              Staff Portal
            </p>
            <p className="font-display text-lg font-bold text-explore-charcoal">
              {session.user.name}
            </p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/staff/login" });
            }}
          >
            <button
              type="submit"
              className="rounded-lg border border-explore-charcoal/20 px-3 py-1.5 text-sm font-semibold"
            >
              Sign out
            </button>
          </form>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-3">
          {STAFF_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-semibold text-explore-charcoal/70 hover:bg-explore-sand hover:text-explore-charcoal"
            >
              {item.label}
              {item.href === "/staff/messages" && unread > 0 && (
                <span className="ml-2 rounded-full bg-explore-orange px-2 py-0.5 text-xs text-white">
                  {unread}
                </span>
              )}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
