import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AuthFormShell } from "@/components/forms/AuthFormShell";
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
    <AuthFormShell
      title="Student Registration"
      subtitle="Create your student account to enroll in courses, register for events, and track your progress."
    >
      <StudentSignupForm />
    </AuthFormShell>
  );
}
