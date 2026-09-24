import { auth } from "@/lib/auth";
import { jsonError } from "@/lib/api/response";
import { TEACHER_PORTAL_ROLES } from "@/lib/constants";

export async function requireTeacherPortal() {
  const session = await auth();
  if (
    !session?.user?.id ||
    !TEACHER_PORTAL_ROLES.includes(session.user.role as (typeof TEACHER_PORTAL_ROLES)[number])
  ) {
    return { error: jsonError("Unauthorized", 401) };
  }
  return { user: session.user };
}
