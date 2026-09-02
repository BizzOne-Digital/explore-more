import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TUTOR_PORTAL_ROLES } from "@/lib/constants";
import { Conversation, StaffInternalConversation, TutorNotification } from "@/models";
import { TutorShell } from "@/components/tutor/TutorShell";
import { tutorSignOut } from "@/app/tutor/(portal)/actions";
import { ensureTutorId } from "@/lib/tutor/tutor-id";

export const dynamic = "force-dynamic";

async function getUnreadCounts(userId: string) {
  await connectDB();
  const [parentMessages, staffMessages, notifications] = await Promise.all([
    Conversation.countDocuments({ staffId: userId, staffUnread: { $gt: 0 } }),
    StaffInternalConversation.countDocuments({
      participants: userId,
      [`unreadCounts.${userId}`]: { $gt: 0 },
    }),
    TutorNotification.countDocuments({ userId, readAt: { $exists: false } }),
  ]);
  return { parentMessages, staffMessages, notifications };
}

export default async function TutorPortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (
    !session?.user ||
    !TUTOR_PORTAL_ROLES.includes(session.user.role as (typeof TUTOR_PORTAL_ROLES)[number])
  ) {
    redirect("/tutor/login");
  }

  const tutorId = await ensureTutorId(session.user.id);
  const unread = await getUnreadCounts(session.user.id);
  const firstName = (session.user.name ?? "Tutor").split(" ")[0];

  return (
    <TutorShell
      firstName={firstName}
      userRole={session.user.role}
      tutorId={tutorId}
      unreadParentMessages={unread.parentMessages}
      unreadStaffMessages={unread.staffMessages}
      unreadNotifications={unread.notifications}
      signOutAction={tutorSignOut}
    >
      {children}
    </TutorShell>
  );
}
