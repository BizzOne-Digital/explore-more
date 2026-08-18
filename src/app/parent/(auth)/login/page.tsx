import type { Metadata } from "next";
import { AuthFormShell } from "@/components/forms/AuthFormShell";
import { ParentLoginForm } from "@/components/forms/ParentLoginForm";

export const metadata: Metadata = {
  title: "Parent Login",
  description: "Sign in to your parent portal.",
};

export default function ParentLoginPage() {
  return (
    <AuthFormShell 
      title="Parent Login" 
      subtitle="Manage your child's learning journey and stay connected."
    >
      <ParentLoginForm />
    </AuthFormShell>
  );
}
