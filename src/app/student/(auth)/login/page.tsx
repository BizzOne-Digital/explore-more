import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { StudentLoginForm } from "@/components/forms/StudentLoginForm";
import { getPortalAccessForUser } from "@/lib/membership/portal-access";

export const metadata: Metadata = {
  title: "Student Login",
  description: "Sign in to your student portal.",
};

export default async function StudentLoginPage() {
  const session = await auth();
  if (session?.user?.role === "student") {
    const access = await getPortalAccessForUser(session.user.id, session.user.role, "student");
    if (access.hasAccess && access.redirectUrl) {
      redirect(access.redirectUrl);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold text-explore-charcoal">Student Sign In</h1>
        <p className="mt-2 text-sm text-explore-charcoal/60">
          Access your courses, events, and track your progress.
        </p>
      </div>
      <Suspense fallback={<p className="text-center text-sm text-explore-charcoal/50">Loading…</p>}>
        <StudentLoginForm />
      </Suspense>
    </div>
  );
}
