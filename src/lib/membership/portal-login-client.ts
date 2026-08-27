import { signOut } from "next-auth/react";

export type PortalLoginKind = "parent" | "student";

interface PortalAccessResponse {
  hasAccess: boolean;
  redirectUrl: string | null;
  reason?: "wrong_role" | "subscription_required" | "inactive_account";
}

export async function completePortalSignIn(portal: PortalLoginKind): Promise<{
  ok: boolean;
  redirectUrl?: string;
  error?: string;
}> {
  const res = await fetch(`/api/auth/portal-access?portal=${portal}`, { cache: "no-store" });
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
        "Please subscribe to a membership to access the portal. Your admin can also activate your account from the admin dashboard.",
    };
  }

  return { ok: true, redirectUrl: data.redirectUrl ?? (portal === "parent" ? "/parent" : "/student") };
}
