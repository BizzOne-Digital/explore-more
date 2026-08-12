import type { Metadata } from "next";
import { AuthFormShell } from "@/components/forms/AuthFormShell";
import { ResetPasswordForm } from "@/components/forms/ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password",
  description: "Set a new password for your Explore More Academy account.",
};

export default function ResetPasswordPage() {
  return (
    <AuthFormShell title="Reset Password" subtitle="Choose a strong new password for your account.">
      <ResetPasswordForm />
    </AuthFormShell>
  );
}
