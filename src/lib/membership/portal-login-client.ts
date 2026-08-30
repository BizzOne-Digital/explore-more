import { getSession, signOut } from "next-auth/react";

export type PortalLoginKind = "parent" | "student";

interface PortalAccessResponse {
  hasAccess: boolean;
  redirectUrl: string | null;
  reason?: "wrong_role" | "subscription_required" | "inactive_account";
}

/** Credentials sign-in can return before the session cookie is readable — wait briefly. */
async function waitForSessionReady(maxAttempts = 12): Promise<boolean> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const session = await getSession();
    if (session?.user?.id) return true;
    await new Promise((resolve) => setTimeout(resolve, 150));
  }
  return false;
}

async function fetchPortalAccess(portal: PortalLoginKind): Promise<Response> {
  return fetch(`/api/auth/portal-access?portal=${portal}`, { cache: "no-store" });
}

export async function completePortalSignIn(portal: PortalLoginKind): Promise<{
  ok: boolean;
  redirectUrl?: string;
  error?: string;
}> {
  const sessionReady = await waitForSessionReady();
  if (!sessionReady) {
    await signOut({ redirect: false });
    return { ok: false, error: "Sign-in is still processing. Please try again." };
  }

  let res = await fetchPortalAccess(portal);
  if (res.status === 401) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    res = await fetchPortalAccess(portal);
  }

  if (!res.ok) {
    await signOut({ redirect: false });
    return { ok: false, error: "Could not verify your account. Please try again." };
  }

  const data = (await res.json()) as PortalAccessResponse;

  if (data.reason === "wrong_role") {
    await signOut({ redirect: false });
    return {
      ok: false,
      error:
        portal === "parent"
          ? "This email is not registered as a parent account. Please use student sign in or create a membership."
          : "This email is not registered as a student account. Please use parent sign in or ask your parent to link your account.",
    };
  }

  if (!data.hasAccess) {
    await signOut({ redirect: false });
    return {
      ok: false,
      error:
        "Please subscribe to a membership to access the portal. Your parent must have an active membership and link your student account, or an admin can activate your family from the dashboard.",
    };
  }

  return { ok: true, redirectUrl: data.redirectUrl ?? (portal === "parent" ? "/parent" : "/student") };
}
