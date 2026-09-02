"use client";

import { signOut } from "next-auth/react";
import { getClientSignOutUrl } from "@/lib/app-url";
import { SIGN_OUT_LANDING_PATH } from "@/lib/auth/constants";

/** Sign out without following Auth.js redirect (which may use vercel.app AUTH_URL). */
export async function clientSignOut(path: string = SIGN_OUT_LANDING_PATH) {
  await signOut({ redirect: false });
  window.location.href = getClientSignOutUrl(path);
}
