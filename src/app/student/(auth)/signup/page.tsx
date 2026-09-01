import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { StudentSignupForm } from "@/components/forms/StudentSignupForm";
import { canOpenStudentSignup } from "@/lib/membership/signup-access";

export const metadata: Metadata = {
  title: "Student Sign Up",
  description: "Create your student account to access courses, events, and resources.",
};

export default async function StudentSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ parentEmail?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const parentUserId = session?.user?.role === "parent" ? session.user.id : null;
  const parentEmail = params.parentEmail ?? (session?.user?.role === "parent" ? session.user.email : null);

  const allowed = await canOpenStudentSignup({
    parentEmail,
    parentUserId,
  });

  if (!allowed) {
    redirect("/membership?reason=student-signup-required");
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold text-explore-charcoal">Student Registration</h1>
        <p className="mt-2 text-sm text-explore-charcoal/60">
          Create your student account to enroll in courses, register for events, and track your progress.
        </p>
      </div>
      <Suspense fallback={<p className="text-center text-sm text-explore-charcoal/50">Loading…</p>}>
        <StudentSignupForm />
      </Suspense>
    </div>
  );
}
