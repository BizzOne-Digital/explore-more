import { auth } from "@/lib/auth";
import { jsonError } from "@/lib/api/response";
import type { SessionUser } from "@/types";
import type { Role } from "@/lib/constants";

export async function requireSession(): Promise<
  { user: SessionUser } | { error: ReturnType<typeof jsonError> }
> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: jsonError("Unauthorized", 401) };
  }
  return {
    user: {
      id: session.user.id,
      email: session.user.email ?? "",
      name: session.user.name ?? "",
      role: session.user.role,
      emailVerified: session.user.emailVerified,
      image: session.user.image ?? undefined,
    },
  };
}

export async function requireRole(
  roles: Role[]
): Promise<{ user: SessionUser } | { error: ReturnType<typeof jsonError> }> {
  const result = await requireSession();
  if ("error" in result) return result;
  if (!roles.includes(result.user.role)) {
    return { error: jsonError("Forbidden", 403) };
  }
  return result;
}

export function verifyCronSecret(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}
