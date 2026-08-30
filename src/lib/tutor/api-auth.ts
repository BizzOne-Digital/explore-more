import { requireRole } from "@/lib/api/auth-helpers";
import { TUTOR_PORTAL_ROLES } from "@/lib/constants";
import type { Role } from "@/lib/constants";

export async function requireTutorPortal() {
  return requireRole([...TUTOR_PORTAL_ROLES] as Role[]);
}
