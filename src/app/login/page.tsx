import type { Metadata } from "next";
import { AuthFormShell } from "@/components/forms/AuthFormShell";
import { LoginForm } from "@/components/forms/LoginForm";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your Explore More Academy account.",
};

export default function LoginPage() {
  return (
    <AuthFormShell title="Welcome Back" subtitle="Sign in to access your portal, enroll in courses, and more.">
      <LoginForm />
    </AuthFormShell>
  );
}
