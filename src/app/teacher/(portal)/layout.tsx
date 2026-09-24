import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TEACHER_PORTAL_ROLES } from "@/lib/constants";
import { TeacherShell } from "@/components/teacher/TeacherShell";
import { teacherSignOut } from "@/app/teacher/(portal)/actions";
import { getPrimarySchoolForTeacher } from "@/lib/teacher/school";
import { SchoolTeacherConversation } from "@/models";
import connectDB from "@/lib/db";

export const dynamic = "force-dynamic";

async function unreadColleagueCount(userId: string, schoolId: string) {
  await connectDB();
  const conversations = await SchoolTeacherConversation.find({
    schoolId,
    participants: userId,
  }).lean();
  let total = 0;
  for (const c of conversations) {
    const map = c.unreadCounts as Map<string, number> | Record<string, number> | undefined;
    const n =
      map instanceof Map
        ? map.get(userId)
        : map && typeof map === "object"
          ? (map as Record<string, number>)[userId]
          : 0;
    total += n ?? 0;
  }
  return total;
}

export default async function TeacherPortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (
    !session?.user ||
    !TEACHER_PORTAL_ROLES.includes(session.user.role as (typeof TEACHER_PORTAL_ROLES)[number])
  ) {
    redirect("/tutor/login");
  }

  const schoolCtx = await getPrimarySchoolForTeacher(session.user.id);
  const schoolName = schoolCtx?.school.name;
  const unread =
    schoolCtx
      ? await unreadColleagueCount(session.user.id, schoolCtx.school._id.toString())
      : 0;

  const firstName = (session.user.name ?? "Teacher").split(" ")[0];
  const staffId = (session.user as { staffId?: string }).staffId;

  return (
    <TeacherShell
      firstName={firstName}
      staffId={staffId}
      schoolName={schoolName}
      unreadColleagueMessages={unread}
      signOutAction={teacherSignOut}
    >
      {children}
    </TeacherShell>
  );
}
