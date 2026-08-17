import type { Metadata } from "next";
import { AuthFormShell } from "@/components/forms/AuthFormShell";
import { StudentLoginForm } from "@/components/forms/StudentLoginForm";

export const metadata: Metadata = {
  title: "Student Login",
  description: "Sign in to your student portal.",
};

export default function StudentLoginPage() {
  return (
    <AuthFormShell 
      title="Student Login" 
      subtitle="Access your courses, events, and track your progress."
    >
      <StudentLoginForm />
    </AuthFormShell>
  );
}
