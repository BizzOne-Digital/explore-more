import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Conversation } from "@/models";
import { getLinkedStudents } from "@/lib/parent/students";
import { ParentSidebar } from "@/components/parent/ParentNav";
import { signOut } from "@/lib/auth";

export const dynamic = "force-dynamic";

async function getParentCounts(userId: string) {
  await connectDB();
  const [messages, notifications] = await Promise.all([
    Conversation.countDocuments({ parentId: userId, parentUnread: { $gt: 0 } }),
    (async () => {
      const { ParentNotification, ParentNotificationRead } = await import("@/models");
      const sent = await ParentNotification.find({
        $or: [{ recipientIds: userId }, { audience: "all_parents" }],
        sentAt: { $ne: null },
      }).select("_id");
      if (sent.length === 0) return 0;
      const read = await ParentNotificationRead.countDocuments({
        userId,
        notificationId: { $in: sent.map((n) => n._id) },
        readAt: { $ne: null },
      });
      return Math.max(0, sent.length - read);
    })(),
  ]);
  return { messages, notifications };
}

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?callbackUrl=/parent");

  const counts = await getParentCounts(session.user.id);

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-explore-cream">
      <div className="border-b border-explore-charcoal/10 bg-white">
        <div className="mx-auto flex w-full min-w-0 max-w-7xl items-center justify-between px-3 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-explore-teal">Parent Portal</p>
            <h1 className="font-display text-xl text-explore-charcoal">Welcome back, {session.user.name}</h1>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button type="submit" className="rounded-lg px-3 py-1.5 text-sm text-explore-charcoal/70 hover:bg-explore-sand">
              Sign Out
            </button>
          </form>
        </div>
      </div>

      <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-6 px-3 py-8 sm:px-6 lg:flex-row">
        <Suspense fallback={null}>
          <ParentSidebar unreadMessages={counts.messages} unreadNotifications={counts.notifications} />
        </Suspense>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}