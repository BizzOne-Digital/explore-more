"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus, Loader, Copy, Check } from "lucide-react";
import { GRADE_LEVELS, formatGradeLabel } from "@/lib/grades";

export function CreateChildForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [grade, setGrade] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [relationship, setRelationship] = useState("Parent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdStudentId, setCreatedStudentId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setCreatedStudentId(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/parent/students", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email: email.trim() || undefined,
          password,
          grade: grade || undefined,
          dateOfBirth: dateOfBirth || undefined,
          relationship,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to create student account");

      setCreatedStudentId(data.data.studentId as string);
      setName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setGrade("");
      setDateOfBirth("");
      onSuccess?.();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create student account");
    } finally {
      setLoading(false);
    }
  }

  async function copyStudentId() {
    if (!createdStudentId) return;
    try {
      await navigator.clipboard.writeText(createdStudentId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm space-y-4 border border-explore-teal/15">
      <div className="flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-explore-teal" />
        <h3 className="font-display text-lg font-bold text-explore-charcoal">Create Student Account</h3>
      </div>
      <p className="text-sm text-explore-charcoal/70">
        Set up your child&apos;s portal login here. Email is optional — without one, they sign in with their{" "}
        <strong>6-digit Student ID</strong> and the password you choose below.
      </p>

      {createdStudentId && (
        <div className="rounded-lg border border-explore-teal/30 bg-explore-teal/5 p-4 text-sm text-explore-charcoal">
          <p className="font-semibold text-explore-teal">Student account created</p>
          <p className="mt-2">
            Student ID:{" "}
            <span className="font-mono text-base font-bold tracking-widest">{createdStudentId}</span>
          </p>
          <button
            type="button"
            onClick={() => void copyStudentId()}
            className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-explore-teal/30 px-3 py-1.5 text-xs font-semibold text-explore-teal hover:bg-white"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : "Copy Student ID"}
          </button>
          <p className="mt-2 text-explore-charcoal/70">
            Student sign-in:{" "}
            <a href="/student/login" className="text-explore-teal hover:underline">Student Portal</a>
          </p>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-explore-charcoal/70">Student&apos;s full name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
          className="w-full rounded-lg border border-explore-charcoal/20 px-4 py-2.5"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-explore-charcoal/70">
          Email <span className="font-normal text-explore-charcoal/50">(optional)</span>
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          placeholder="Leave blank for Student ID login only"
          className="w-full rounded-lg border border-explore-charcoal/20 px-4 py-2.5"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-explore-charcoal/70">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-explore-charcoal/20 px-4 py-2.5"
          />
          <p className="mt-1 text-xs text-explore-charcoal/50">At least 8 characters</p>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-explore-charcoal/70">Confirm password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full rounded-lg border border-explore-charcoal/20 px-4 py-2.5"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-explore-charcoal/70">Grade (optional)</label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="w-full rounded-lg border border-explore-charcoal/20 px-4 py-2.5"
          >
            <option value="">Select grade…</option>
            {GRADE_LEVELS.map((g) => (
              <option key={g} value={g}>{formatGradeLabel(g)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-explore-charcoal/70">Date of birth (optional)</label>
          <input
            type="date"
            value={dateOfBirth}
            onChange={(e) => setDateOfBirth(e.target.value)}
            className="w-full rounded-lg border border-explore-charcoal/20 px-4 py-2.5"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-explore-charcoal/70">Your relationship</label>
        <select
          value={relationship}
          onChange={(e) => setRelationship(e.target.value)}
          className="w-full rounded-lg border border-explore-charcoal/20 px-4 py-2.5"
        >
          <option value="Parent">Parent</option>
          <option value="Guardian">Guardian</option>
          <option value="Grandparent">Grandparent</option>
          <option value="Other">Other</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-explore-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-explore-teal/90 disabled:opacity-50"
      >
        {loading ? <Loader className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        Create &amp; link student
      </button>
    </form>
  );
}
