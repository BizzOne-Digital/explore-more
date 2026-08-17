import type { Metadata } from "next";
import { AuthFormShell } from "@/components/forms/AuthFormShell";
import { StudentSignupForm } from "@/components/forms/StudentSignupForm";

export const metadata: Metadata = {
  title: "Student Sign Up",
  description: "Create your student account to access courses, events, and resources.",
};

export default function StudentSignupPage() {
  return (
    <AuthFormShell 
      title="Student Registration" 
      subtitle="Create your student account to enroll in courses, register for events, and track your progress."
    >
      <StudentSignupForm />
    </AuthFormShell>
  );
}
