import type { Metadata } from "next";
import { AuthFormShell } from "@/components/forms/AuthFormShell";
import { VerifyEmailForm } from "@/components/forms/VerifyEmailForm";

export const metadata: Metadata = {
  title: "Verify Email",
  description: "Verify your Explore More Academy email address.",
};

export default function VerifyEmailPage() {
  return (
    <AuthFormShell title="Verify Your Email" subtitle="One more step to activate your account.">
      <VerifyEmailForm />
    </AuthFormShell>
  );
}
