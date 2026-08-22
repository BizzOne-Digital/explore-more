"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const data = Object.fromEntries(new FormData(e.currentTarget));

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Registration failed");

      const params = new URLSearchParams({
        email: String(data.email),
        callbackUrl,
      });
      if (json.devVerificationCode) {
        params.set("token", json.devVerificationCode);
      }
      if (json.emailSent === false) {
        params.set("emailFailed", "1");
        if (json.emailError) {
          params.set("emailError", json.emailError);
        }
      }
      router.push(`/verify-email?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input name="name" label="Full Name" required autoComplete="name" />
      <Input name="email" type="email" label="Email" required autoComplete="email" />
      <Input name="password" type="password" label="Password" required minLength={8} autoComplete="new-password" />
      <Select
        name="role"
        label="I am a..."
        required
        options={[
          { value: "parent", label: "Parent / Guardian" },
          { value: "student", label: "Student (13+)" },
        ]}
      />
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" name="terms" required className="mt-1 rounded" />
        <span className="text-sm text-explore-charcoal/70">
          I agree to the{" "}
          <Link href="/terms" className="text-explore-teal hover:underline">Terms of Service</Link>
          {" "}and{" "}
          <Link href="/privacy" className="text-explore-teal hover:underline">Privacy Policy</Link>.
        </span>
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" size="lg" disabled={loading} className="w-full">
        {loading ? "Creating account..." : "Create Account"}
      </Button>
      <p className="text-center text-sm text-explore-charcoal/60">
        Already have an account?{" "}
        <Link href={`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-explore-teal font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </form>
  );
}
