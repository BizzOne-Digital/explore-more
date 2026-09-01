"use server";

import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth";
import { absoluteUrl, getAppUrl, getRequestOrigin } from "@/lib/app-url";

async function resolveSignOutOrigin(): Promise<string> {
  const requestOrigin = await getRequestOrigin();
  if (!requestOrigin.includes("vercel.app")) {
    return requestOrigin;
  }
  return getAppUrl();
}

export async function signOutToPath(path: string) {
  const target = absoluteUrl(await resolveSignOutOrigin(), path);
  await signOut({ redirect: false });
  redirect(target);
}
