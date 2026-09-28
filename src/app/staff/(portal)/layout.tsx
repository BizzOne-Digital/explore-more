import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { STAFF_PORTAL_ROLES } from "@/lib/constants";
import { Conversation } from "@/models";
import Link from "next/link";
import { signOutToHome } from "@/lib/auth/sign-out";
import { STAFF_NAV_ITEMS } from "@/lib/staff/nav";
import { StaffPortalHeader } from "@/components/staff/StaffPortalHeader";
import { getUserAvatar } from "@/lib/account/get-user-avatar";

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
  const fullName = session.user.name ?? "Staff";
  const firstName = fullName.split(" ")[0];
  const initialAvatar = await getUserAvatar(session.user.id);

  async function staffSignOut() {
    "use server";
    await signOutToHome();
  }

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-explore-cream">
      <StaffPortalHeader
        fullName={fullName}
        firstName={firstName}
        initialAvatar={initialAvatar}
        signOutAction={staffSignOut}
      />
      <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto border-b border-explore-charcoal/10 bg-white px-4 pb-3">
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
      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
