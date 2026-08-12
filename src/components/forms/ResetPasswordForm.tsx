"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const password = (e.currentTarget.elements.namedItem("password") as HTMLInputElement).value;
    const confirm = (e.currentTarget.elements.namedItem("confirm") as HTMLInputElement).value;

    if (password !== confirm) {
      setError("Passwords do not match");
      setStatus("error");
      return;
    }

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Reset failed");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (!token) {
    return (
      <p className="text-sm text-red-600 text-center">
        Invalid reset link. Please request a new password reset.
      </p>
    );
  }

  if (status === "success") {
    return (
      <div className="text-center space-y-4">
        <p className="font-display text-xl font-bold text-explore-forest">Password updated!</p>
        <Button href="/login" variant="secondary">Sign In</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input name="password" type="password" label="New Password" required minLength={8} autoComplete="new-password" />
      <Input name="confirm" type="password" label="Confirm Password" required minLength={8} autoComplete="new-password" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" size="lg" disabled={status === "loading"} className="w-full">
        {status === "loading" ? "Updating..." : "Reset Password"}
      </Button>
    </form>
  );
}
