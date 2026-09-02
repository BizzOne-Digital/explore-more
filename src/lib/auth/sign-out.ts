"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";
import { absoluteUrl, getAppUrl, getRequestOrigin } from "@/lib/app-url";
import { SIGN_OUT_LANDING_PATH } from "@/lib/auth/constants";

async function resolveSignOutOrigin(): Promise<string> {
  const requestOrigin = await getRequestOrigin();
  if (!requestOrigin.includes("vercel.app")) {
    return requestOrigin;
  }
  return getAppUrl();
}

export async function signOutToPath(path: string = SIGN_OUT_LANDING_PATH) {
  const target = absoluteUrl(await resolveSignOutOrigin(), path);
  await signOut({ redirect: false });
  redirect(target);
}

export async function signOutToHome() {
  await signOutToPath(SIGN_OUT_LANDING_PATH);
}
