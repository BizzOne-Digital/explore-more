import type { Metadata } from "next";
import { AuthFormShell } from "@/components/forms/AuthFormShell";
import { RegisterForm } from "@/components/forms/RegisterForm";

export const metadata: Metadata = {
  title: "Register",
  description: "Create your Explore More Academy account.",
};

export default function RegisterPage() {
  return (
    <AuthFormShell title="Join the Adventure" subtitle="Create an account to enroll, register for events, and track progress.">
      <RegisterForm />
    </AuthFormShell>
  );
}
