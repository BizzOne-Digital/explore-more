import type { Metadata } from "next";
import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Conversation } from "@/models";
import { ParentShell } from "@/components/parent/ParentShell";
import { ensureGuardianId } from "@/lib/parent/guardian-id";
import { getParentMembershipAccess } from "@/lib/membership/access";
import { getRequiredFeatureForParentPath } from "@/lib/membership/route-features";
import { parentSignOut } from "@/app/parent/(portal)/actions";

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

  const isAdmin = session.user.role === "administrator";

  if (!isAdmin) {
    if (session.user.role !== "parent") {
      redirect("/membership?reason=subscription-required");
    }

    try {
      const access = await getParentMembershipAccess(session.user.id);
      if (!access.hasActiveMembership) {
        redirect("/membership?reason=subscription-required");
      }
    } catch (error) {
      console.error("Parent membership access check failed:", error);
      redirect("/membership?reason=subscription-required");
    }
  }

  const pathname = (await headers()).get("x-pathname") ?? "/parent";
  let access: Awaited<ReturnType<typeof getParentMembershipAccess>>;
  if (isAdmin) {
    access = {
      hasActiveMembership: true,
      tierId: "legacy" as const,
      planName: "Administrator",
      planSlug: null,
      features: [] as import("@/lib/membership/entitlements").MembershipFeature[],
      hasFeature: () => true,
    };
  } else {
    access = await getParentMembershipAccess(session.user.id);
  }

  if (!isAdmin && access.hasActiveMembership) {
    const required = getRequiredFeatureForParentPath(pathname);
    if (pathname.startsWith("/parent/tutors")) {
      if (!access.hasFeature("tutoringSession30") && !access.hasFeature("tutoringSession60")) {
        redirect("/parent?upgrade=tutoring");
      }
    } else if (required && !access.hasFeature(required)) {
      redirect("/parent?upgrade=1");
    }
  }

  let guardianId: string | undefined;
  let counts = { messages: 0, notifications: 0 };
  try {
    guardianId = (await ensureGuardianId(session.user.id)) ?? undefined;
    counts = await getParentCounts(session.user.id);
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
      signOutAction={parentSignOut}
    >
      {children}
    </ParentShell>
  );
}
