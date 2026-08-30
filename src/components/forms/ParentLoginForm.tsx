"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { completePortalSignIn } from "@/lib/membership/portal-login-client";

export function ParentLoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
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

    if (result?.error) {
      setLoading(false);
      setError("Invalid email or password. Please try again.");
      return;
    }

    const portalResult = await completePortalSignIn("parent");
    setLoading(false);

    if (!portalResult.ok) {
      setError(portalResult.error ?? "Unable to sign in.");
      return;
    }

    const destination = callbackUrl || portalResult.redirectUrl || "/parent";
    globalThis.location.assign(destination);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-lg border border-explore-teal/20 bg-explore-teal/10 p-4 mb-6">
        <p className="text-sm text-explore-charcoal/80">
          <strong>Parent Portal Access</strong> — Sign in with your parent account. An active
          membership is required.
        </p>
      </div>

      <Input
        name="email"
        type="email"
        label="Email"
        required
        autoComplete="email"
        defaultValue={searchParams.get("email") || ""}
      />
      <Input
        name="password"
        type="password"
        label="Password"
        required
        autoComplete="current-password"
      />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>{error}</p>
          {error.includes("subscribe") && (
            <Link href="/membership?portal=parent" className="mt-2 inline-block font-medium text-explore-teal hover:underline">
              View membership plans
            </Link>
          )}
        </div>
      )}

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
        <Link href="/parent-portal" className="font-medium text-explore-teal hover:underline">
          Create parent account
        </Link>
      </p>

      <p className="text-center text-sm text-explore-charcoal/50">
        Are you a student?{" "}
        <Link href="/student/login" className="font-medium text-explore-teal hover:underline">
          Student sign in
        </Link>
      </p>
    </form>
  );
}
