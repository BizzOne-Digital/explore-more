import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Conversation } from "@/models";
import { STAFF_PORTAL_ROLES } from "@/lib/constants";
import Link from "next/link";
import { MessagesSquare, Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function StaffDashboardPage() {
  const session = await auth();
  if (!session?.user || !STAFF_PORTAL_ROLES.includes(session.user.role as (typeof STAFF_PORTAL_ROLES)[number])) {
    redirect("/staff/login");
  }

  await connectDB();
  const unreadMessages = await Conversation.countDocuments({
    staffId: session.user.id,
    staffUnread: { $gt: 0 },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-explore-charcoal">
          Welcome, {(session.user.name ?? "Staff").split(" ")[0]}
        </h2>
        <p className="mt-1 text-sm text-explore-charcoal/70">
          Staff dashboard — respond to parent messages and support calls.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/staff/messages"
          className="rounded-xl border border-explore-charcoal/10 bg-white p-6 shadow-sm transition hover:border-explore-teal/30"
        >
          <MessagesSquare className="h-8 w-8 text-explore-teal" />
          <p className="mt-3 font-semibold text-explore-charcoal">Parent Messages</p>
          <p className="mt-1 text-sm text-explore-charcoal/60">
            {unreadMessages > 0
              ? `${unreadMessages} unread conversation${unreadMessages === 1 ? "" : "s"}`
              : "No unread messages"}
          </p>
        </Link>

        <div className="rounded-xl border border-explore-charcoal/10 bg-white p-6 shadow-sm">
          <Users className="h-8 w-8 text-explore-orange" />
          <p className="mt-3 font-semibold text-explore-charcoal">Your Staff ID</p>
          <p className="mt-1 font-mono text-sm text-explore-teal">
            {(session.user as { staffId?: string }).staffId ?? session.user.id.slice(-8)}
          </p>
        </div>
      </div>
    </div>
  );
}
