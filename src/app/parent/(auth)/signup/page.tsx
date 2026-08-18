import type { Metadata } from "next";
import { AuthFormShell } from "@/components/forms/AuthFormShell";
import { ParentSignupForm } from "@/components/forms/ParentSignupForm";

export const metadata: Metadata = {
  title: "Parent Sign Up",
  description: "Create your parent account to manage your child's learning journey.",
};

export default function ParentSignupPage() {
  return (
    <AuthFormShell 
      title="Parent Registration" 
      subtitle="Create your parent account to manage your child's courses, track progress, and stay connected."
    >
      <ParentSignupForm />
    </AuthFormShell>
  );
}
