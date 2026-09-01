"use server";

import { signOutToPath } from "@/lib/auth/sign-out";

export async function tutorSignOut() {
  await signOutToPath("/tutor/login");
}
