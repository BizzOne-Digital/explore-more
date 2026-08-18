import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { Conversation } from "@/models";
import { ParentSidebar } from "@/components/parent/ParentNav";
import { ParentPortalHeader } from "@/components/parent/ParentPortalHeader";
import { signOut } from "@/lib/auth";
import { ensureGuardianId } from "@/lib/parent/guardian-id";

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

export default async function ParentPortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/parent/login?callbackUrl=/parent");

  const guardianId = await ensureGuardianId(session.user.id);
  const counts = await getParentCounts(session.user.id);
  const firstName = (session.user.name ?? "Parent").split(" ")[0];

  return (
    <div className="min-h-screen w-full overflow-x-clip bg-explore-cream">
      <ParentPortalHeader
        firstName={firstName}
        guardianId={guardianId ?? ""}
        signOutAction={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      />

      <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-col gap-6 px-3 py-8 sm:px-6 lg:flex-row">
        <Suspense fallback={null}>
          <ParentSidebar unreadMessages={counts.messages} unreadNotifications={counts.notifications} />
        </Suspense>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
