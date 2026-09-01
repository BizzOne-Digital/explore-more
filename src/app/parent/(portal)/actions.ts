"use server";

import { signOutToPath } from "@/lib/auth/sign-out";

export async function parentSignOut() {
  await signOutToPath("/");
}
