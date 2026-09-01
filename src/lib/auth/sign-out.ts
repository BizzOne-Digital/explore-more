"use server";

import { signOut } from "@/lib/auth";
import { absoluteUrl, getRequestOrigin } from "@/lib/app-url";

export async function signOutToPath(path: string) {
  const origin = await getRequestOrigin();
  await signOut({ redirectTo: absoluteUrl(origin, path) });
}
