import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TEACHER_PORTAL_ROLES } from "@/lib/constants";
import { getPrimarySchoolForTeacher } from "@/lib/teacher/school";

export const dynamic = "force-dynamic";

export default async function TeacherProfilePage() {
  const session = await auth();
  if (
    !session?.user ||
    !TEACHER_PORTAL_ROLES.includes(session.user.role as (typeof TEACHER_PORTAL_ROLES)[number])
  ) {
    redirect("/tutor/login");
  }

  const schoolCtx = await getPrimarySchoolForTeacher(session.user.id);

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">Settings</h2>
      <div className="rounded-2xl bg-white p-6 shadow-sm space-y-3 text-sm">
        <p><span className="text-gray-500">Name:</span> {session.user.name}</p>
        <p><span className="text-gray-500">Email:</span> {session.user.email}</p>
        <p>
          <span className="text-gray-500">School:</span>{" "}
          {schoolCtx?.school.name ?? "Not assigned — contact your administrator"}
        </p>
      </div>
    </div>
  );
}
