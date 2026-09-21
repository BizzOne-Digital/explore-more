"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function StudentSignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/membership";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdStudentId, setCreatedStudentId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const emailRaw = String(formData.get("email") ?? "").trim();
    const data = {
      name: formData.get("name"),
      email: emailRaw || undefined,
      password: formData.get("password"),
      role: "student",
    };

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Registration failed");

      if (json.skipEmailVerification && json.studentId) {
        setCreatedStudentId(String(json.studentId));
        return;
      }

      const params = new URLSearchParams({
        email: emailRaw,
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

  if (createdStudentId) {
    return (
      <div className="space-y-5 rounded-2xl border border-explore-teal/30 bg-explore-teal/5 p-6 text-center">
        <h2 className="font-display text-xl font-bold text-explore-charcoal">Account created</h2>
        <p className="text-sm text-explore-charcoal/70">
          Save your <strong>Student ID</strong>. You will use it to sign in (with your password).
        </p>
        <p className="font-mono text-2xl font-bold tracking-widest text-explore-teal">{createdStudentId}</p>
        <Button
          href={`/student/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          size="lg"
          className="w-full"
        >
          Go to student sign in
        </Button>
        <p className="text-xs text-explore-charcoal/50">
          Parents can also create and link accounts from the Parent Portal under My Children.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-lg bg-explore-teal/10 border border-explore-teal/20 p-4 mb-6">
        <p className="text-sm text-explore-charcoal/80">
          <strong>Student Registration</strong> — Students 13+ can register here. Under 13? Ask a parent to
          create your account from <strong>Parent Portal → My Children</strong>. Email is optional; without one,
          sign in with your 6-digit Student ID and password.
        </p>
      </div>
      
      <Input name="name" label="Full Name" required autoComplete="name" />
      <Input
        name="email"
        type="email"
        label="Email (optional)"
        autoComplete="email"
        helperText="Leave blank if you will sign in with your Student ID only"
      />
      <Input 
        name="password" 
        type="password" 
        label="Password" 
        required 
        minLength={8} 
        autoComplete="new-password"
        helperText="Minimum 8 characters"
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
        {loading ? "Creating account..." : "Create Student Account"}
      </Button>
      
      <p className="text-center text-sm text-explore-charcoal/60">
        Already have an account?{" "}
        <Link href={`/student/login?callbackUrl=${encodeURIComponent(callbackUrl)}`} className="text-explore-teal font-medium hover:underline">
          Sign in
        </Link>
      </p>
      
      <p className="text-center text-sm text-explore-charcoal/50">
        Are you a parent?{" "}
        <Link href="/parent/signup" className="text-explore-teal font-medium hover:underline">
          Register as Parent
        </Link>
      </p>
    </form>
  );
}
