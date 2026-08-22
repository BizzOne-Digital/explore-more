"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { GRADE_LEVELS, formatGradeLabel } from "@/lib/grades";

export function ParentSignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/parent";
  const defaultEmail = searchParams.get("email") || "";
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const childGrade = String(formData.get("childGrade") ?? "");
    if (!childGrade) {
      setError("Please select your child's grade");
      setLoading(false);
      return;
    }

    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      role: "parent",
      childGrade,
    };

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
      router.push(`/verify-email?${params.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-lg border border-explore-teal/20 bg-explore-teal/10 p-4">
        <p className="text-sm text-explore-charcoal/80">
          <strong>Parent/Guardian Registration</strong> — Create an account to manage your child&apos;s
          learning journey, track progress, and receive grade-specific assessments.
        </p>
      </div>

      <Input name="name" label="Full Name" required autoComplete="name" />

      <div>
        <label htmlFor="childGrade" className="mb-1.5 block text-sm font-medium text-explore-charcoal">
          Child&apos;s Grade <span className="text-red-500">*</span>
        </label>
        <select
          id="childGrade"
          name="childGrade"
          required
          className="w-full rounded-lg border border-explore-charcoal/15 bg-white px-4 py-2.5 text-sm text-explore-charcoal focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
          defaultValue=""
        >
          <option value="" disabled>
            Select grade...
          </option>
          {GRADE_LEVELS.map((grade) => (
            <option key={grade} value={grade}>
              {formatGradeLabel(grade)}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-explore-charcoal/50">
          Assessments and resources are sent based on your child&apos;s grade.
        </p>
      </div>

      <Input
        name="email"
        type="email"
        label="Email"
        required
        autoComplete="email"
        defaultValue={defaultEmail}
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

      <label className="flex cursor-pointer items-start gap-3">
        <input type="checkbox" name="terms" required className="mt-1 rounded" />
        <span className="text-sm text-explore-charcoal/70">
          I agree to the{" "}
          <Link href="/terms" className="text-explore-teal hover:underline">
            Terms of Service
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-explore-teal hover:underline">
            Privacy Policy
          </Link>
          .
        </span>
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button type="submit" size="lg" disabled={loading} className="w-full">
        {loading ? "Creating account..." : "Create Parent Account"}
      </Button>

      <p className="text-center text-sm text-explore-charcoal/60">
        Already have an account?{" "}
        <Link
          href={`/parent/login?callbackUrl=${encodeURIComponent(callbackUrl)}`}
          className="font-medium text-explore-teal hover:underline"
        >
          Sign in
        </Link>
      </p>

      <p className="text-center text-sm text-explore-charcoal/50">
        Are you a student?{" "}
        <Link href="/student/signup" className="font-medium text-explore-teal hover:underline">
          Register as Student
        </Link>
      </p>
    </form>
  );
}
