"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function ForgotPasswordForm() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setError("");

    const email = (e.currentTarget.elements.namedItem("email") as HTMLInputElement).value;

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Request failed");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Something went wrong");
    }
  }

  if (status === "success") {
    return (
      <div className="text-center space-y-4">
        <p className="font-display text-xl font-bold text-explore-teal">Check your email</p>
        <p className="text-sm text-explore-charcoal/70">
          If an account exists with that email, we&apos;ve sent password reset instructions.
        </p>
        <Button href="/login" variant="outline">Back to Login</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input name="email" type="email" label="Email" required autoComplete="email" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" size="lg" disabled={status === "loading"} className="w-full">
        {status === "loading" ? "Sending..." : "Send Reset Link"}
      </Button>
      <p className="text-center text-sm">
        <Link href="/login" className="text-explore-teal hover:underline">Back to login</Link>
      </p>
    </form>
  );
}
