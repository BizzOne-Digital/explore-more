"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function StudentLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/membership";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password. Please try again.");
      return;
    }

    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-lg bg-explore-teal/10 border border-explore-teal/20 p-4 mb-6">
        <p className="text-sm text-explore-charcoal/80">
          <strong>Student Portal Access</strong> - Sign in with your student account credentials.
        </p>
      </div>
      
      <Input name="email" type="email" label="Email" required autoComplete="email" />
      <Input name="password" type="password" label="Password" required autoComplete="current-password" />
      
      {error && <p className="text-sm text-red-600">{error}</p>}
      
      <div className="flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-explore-teal hover:underline">
          Forgot password?
        </Link>
      </div>
      
      <Button type="submit" size="lg" disabled={loading} className="w-full">
        {loading ? "Signing in..." : "Sign In"}
      </Button>
      
      <p className="text-center text-sm text-explore-charcoal/60">
        Don&apos;t have an account?{" "}
        <Link href={`/student/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-explore-teal font-medium hover:underline">
          Create Student Account
        </Link>
      </p>
      
      <p className="text-center text-sm text-explore-charcoal/50">
        Are you a parent?{" "}
        <Link href="/parent/login" className="text-explore-teal font-medium hover:underline">
          Parent Login
        </Link>
      </p>
    </form>
  );
}
