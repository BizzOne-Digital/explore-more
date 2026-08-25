"use server";

import { signOut } from "@/lib/auth";

export async function parentSignOut() {
  await signOut({ redirectTo: "/" });
}
