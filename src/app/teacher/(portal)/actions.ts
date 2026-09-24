"use server";

import { signOutToHome } from "@/lib/auth/sign-out";

export async function teacherSignOut() {
  await signOutToHome();
}
