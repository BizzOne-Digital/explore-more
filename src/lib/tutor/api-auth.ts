import { auth } from "@/lib/auth";
import { jsonError } from "@/lib/api/response";
import { TUTOR_PORTAL_ROLES } from "@/lib/constants";

export async function requireTutorPortal() {
  const session = await auth();
  if (
    !session?.user?.id ||
    !TUTOR_PORTAL_ROLES.includes(session.user.role as (typeof TUTOR_PORTAL_ROLES)[number])
  ) {
    return { error: jsonError("Unauthorized", 401) };
  }
  return { user: session.user };
}

/** Alias for workspace APIs */
export const requireTutorApi = requireTutorPortal;
