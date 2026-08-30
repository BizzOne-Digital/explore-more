import { getSession, signOut } from "next-auth/react";

export type PortalLoginKind = "parent" | "student";

interface PortalAccessResponse {
  hasAccess: boolean;
  redirectUrl: string | null;
  reason?:
    | "wrong_role"
    | "subscription_required"
    | "inactive_account"
    | "no_guardian_link"
    | "link_pending"
    | "parent_no_membership"
    | "parent_plan_ineligible";
  detail?: string;
}

const STUDENT_ACCESS_MESSAGES: Record<string, string> = {
  no_guardian_link:
    "Your student account is not linked to a parent yet. Ask your parent to link you from their portal, or contact Explore More Academy.",
  link_pending:
    "Your parent connection is still waiting for approval. Your parent or academy staff must approve the link before you can sign in.",
  parent_no_membership:
    "Your family does not have an active membership or free trial yet. Your parent needs an Active or Trialing subscription before you can access the student portal.",
  parent_plan_ineligible:
    "Your family's membership plan does not include student portal access. Please contact the academy.",
  subscription_required:
    "Student portal access requires an active family membership. Your parent must subscribe or have a trial, and your accounts must be linked.",
};

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
  reason?: string;
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
    const reason = data.reason ?? "subscription_required";
    const error =
      portal === "student"
        ? data.detail ?? STUDENT_ACCESS_MESSAGES[reason] ?? STUDENT_ACCESS_MESSAGES.subscription_required
        : "Please subscribe to a membership to access the parent portal, or contact the academy for a trial.";
    return { ok: false, error, reason };
  }

  return { ok: true, redirectUrl: data.redirectUrl ?? (portal === "parent" ? "/parent" : "/student") };
}
