import type { Metadata } from "next";
import connectDB from "@/lib/db";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Conversation } from "@/models";
import { ParentShell } from "@/components/parent/ParentShell";
import { ensureGuardianId } from "@/lib/parent/guardian-id";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Parent Portal",
  robots: { index: false, follow: false },
};

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
    <ParentShell
      firstName={firstName}
      guardianId={guardianId ?? undefined}
      unreadMessages={counts.messages}
      unreadNotifications={counts.notifications}
      signOutAction={async () => {
        "use server";
        await signOut({ redirectTo: "/" });
      }}
    >
      {children}
    </ParentShell>
  );
}
