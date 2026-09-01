"use client";

import { signOut } from "next-auth/react";
import { getClientSignOutUrl } from "@/lib/app-url";

/** Sign out without following Auth.js redirect (which may use vercel.app AUTH_URL). */
export async function clientSignOut(path: string) {
  await signOut({ redirect: false });
  window.location.href = getClientSignOutUrl(path);
}
