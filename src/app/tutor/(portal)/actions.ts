"use server";

import { signOut } from "@/lib/auth";

export async function tutorSignOut() {
  await signOut({ redirectTo: "/tutor/login" });
}
