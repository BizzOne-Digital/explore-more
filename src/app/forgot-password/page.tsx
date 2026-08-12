import type { Metadata } from "next";
import { AuthFormShell } from "@/components/forms/AuthFormShell";
import { ForgotPasswordForm } from "@/components/forms/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "Forgot Password",
  description: "Reset your Explore More Academy password.",
};

export default function ForgotPasswordPage() {
  return (
    <AuthFormShell title="Forgot Password" subtitle="Enter your email and we'll send reset instructions.">
      <ForgotPasswordForm />
    </AuthFormShell>
  );
}
