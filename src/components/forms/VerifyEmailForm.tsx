"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const token = (e.currentTarget.elements.namedItem("token") as HTMLInputElement).value;

    try {
      const res = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Verification failed");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "success") {
    return (
      <div className="text-center space-y-4">
        <p className="font-display text-xl font-bold text-explore-forest">Email verified!</p>
        <p className="text-sm text-explore-charcoal/70">Your account is active. You can now sign in.</p>
        <Button href="/login" variant="secondary">Sign In</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <p className="text-sm text-explore-charcoal/70">
        We sent a verification code to <strong>{email || "your email"}</strong>. Enter it below.
      </p>
      <Input name="token" label="Verification Code" required placeholder="Enter code from email" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" size="lg" disabled={status === "loading"} className="w-full">
        {status === "loading" ? "Verifying..." : "Verify Email"}
      </Button>
    </form>
  );
}
