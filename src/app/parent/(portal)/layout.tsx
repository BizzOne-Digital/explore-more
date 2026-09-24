import type { Metadata } from "next";
import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Conversation } from "@/models";
import { ParentShell } from "@/components/parent/ParentShell";
import { ensureGuardianId } from "@/lib/parent/guardian-id";
import { getParentMembershipAccess } from "@/lib/membership/access";
import { isParentPathAllowed } from "@/lib/membership/route-features";
import { parentSignOut } from "@/app/parent/(portal)/actions";
import { markAllParentNotificationsRead } from "@/lib/notifications/parent-inbox";
import { getParentBillingAlert } from "@/lib/billing/parent-billing-alert";

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
      const { parentNotificationInboxFilter } = await import("@/lib/notifications/parent-inbox");
      const sent = await ParentNotification.find(parentNotificationInboxFilter(userId)).select("_id");
      if (sent.length === 0) return 0;
      const reads = await ParentNotificationRead.find({
        userId,
        notificationId: { $in: sent.map((n) => n._id) },
      });
      const readMap = new Map(reads.map((r) => [r.notificationId.toString(), r]));
      return sent.filter((n) => {
        const record = readMap.get(n._id.toString());
        if (record?.deletedAt) return false;
        return !record?.readAt;
      }).length;
    })(),
  ]);
  return { messages, notifications };
}

export default async function ParentPortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/parent/login?callbackUrl=/parent");

  const isAdmin = session.user.role === "administrator";

  if (!isAdmin && session.user.role !== "parent") {
    redirect("/parent-portal");
  }

  const pathname = (await headers()).get("x-pathname") ?? "/parent";
  let access: Awaited<ReturnType<typeof getParentMembershipAccess>>;
  if (isAdmin) {
    access = {
      hasActiveMembership: true,
      hasPortalAccess: true,
      isFreeAccount: false,
      tierId: "legacy" as const,
      planName: "Administrator",
      planSlug: null,
      features: [] as import("@/lib/membership/entitlements").MembershipFeature[],
      hasFeature: () => true,
    };
  } else {
    access = await getParentMembershipAccess(session.user.id);
  }

  if (!isAdmin && access.hasPortalAccess && !isParentPathAllowed(pathname, access.hasFeature)) {
    redirect("/parent?upgrade=1");
  }

  let guardianId: string | undefined;
  let counts = { messages: 0, notifications: 0 };
  let billingAlert: Awaited<ReturnType<typeof getParentBillingAlert>> = null;
  try {
    if (pathname === "/parent/notifications" || pathname.startsWith("/parent/notifications/")) {
      await markAllParentNotificationsRead(session.user.id);
    }
    guardianId = (await ensureGuardianId(session.user.id)) ?? undefined;
    counts = await getParentCounts(session.user.id);
    if (!isAdmin) {
      billingAlert = await getParentBillingAlert(session.user.id);
    }
  } catch (error) {
    console.error("Parent portal shell data failed:", error);
  }
  const firstName = (session.user.name ?? "Parent").split(" ")[0];

  return (
    <ParentShell
      firstName={firstName}
      guardianId={guardianId}
      unreadMessages={counts.messages}
      unreadNotifications={counts.notifications}
      showAllNav={isAdmin}
      membershipFeatures={isAdmin ? undefined : access.features}
      billingAlert={isAdmin ? null : billingAlert}
      signOutAction={parentSignOut}
    >
      {children}
    </ParentShell>
  );
}
