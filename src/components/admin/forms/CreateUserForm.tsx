"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { KeyRound, Copy, Check } from "lucide-react";
import {
  FormField,
  TextInput,
  FormSection,
  FormActions,
} from "@/components/admin/forms";
import { PageHeader } from "@/components/admin/PageHeader";
import { generateAccountPassword } from "@/lib/admin/password";
import { STAFF_CATEGORIES, STAFF_CATEGORY_LABELS } from "@/lib/portfolio/constants";
import type { Role } from "@/lib/constants";

const ROLE_OPTIONS: { value: Role; label: string; description: string }[] = [
  {
    value: "parent",
    label: "Parent / Guardian",
    description: "Access to parent portal, billing, children, portfolio",
  },
  {
    value: "student",
    label: "Student",
    description: "Access to student portal, courses, and resources",
  },
  {
    value: "staff",
    label: "Staff / Employee",
    description: "Staff dashboard for parent messages and call support",
  },
  {
    value: "instructor",
    label: "Instructor",
    description: "Teaching staff with staff dashboard and portfolio tools",
  },
  {
    value: "administrator",
    label: "Administrator",
    description: "Full admin portal access",
  },
];

export function CreateUserForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [created, setCreated] = useState<{
    email: string;
    password: string;
    loginHint: string;
        staffId?: string;
        tutorId?: string;
        studentId?: string;
    role: Role;
  } | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState(() => generateAccountPassword());
  const [role, setRole] = useState<Role>("staff");
  const [emailVerified, setEmailVerified] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [staffTitle, setStaffTitle] = useState("Front Desk");
  const [staffCategories, setStaffCategories] = useState<string[]>(["administration"]);
  const [messagingAvailable, setMessagingAvailable] = useState(true);
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [schoolStatus, setSchoolStatus] = useState("");
  const [bio, setBio] = useState("");

  const isStaffRole = role === "staff" || role === "instructor" || role === "administrator";
  const isStudent = role === "student";

  function handleGeneratePassword() {
    setPassword(generateAccountPassword());
    setCopied(false);
  }

  async function handleCopyPassword() {
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function toggleCategory(category: string) {
    setStaffCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          phone: phone || undefined,
          role,
          emailVerified,
          isActive,
          staffTitle: isStaffRole ? staffTitle : undefined,
          staffCategories: isStaffRole && staffCategories.length ? staffCategories : undefined,
          messagingAvailable: isStaffRole ? messagingAvailable : undefined,
          dateOfBirth: isStudent && dateOfBirth ? dateOfBirth : undefined,
          schoolStatus: isStudent && schoolStatus ? schoolStatus : undefined,
          bio: isStudent && bio ? bio : undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Failed to create user");

      setCreated({
        email,
        password,
        loginHint: json.data.loginHint,
        staffId: json.data.user?.staffId,
        tutorId: json.data.user?.tutorId,
        studentId: json.data.user?.studentId,
        role,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (created) {
    return (
      <div className="space-y-6">
        <PageHeader title="Account Created" description="Share these credentials securely with the user." />
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-6 space-y-4">
          <p className="text-sm text-green-200 font-semibold">Login credentials</p>
          <div className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <p className="text-white/50">Email</p>
              <p className="font-mono text-white">{created.email}</p>
            </div>
            <div>
              <p className="text-white/50">Password</p>
              <p className="font-mono text-white">{created.password}</p>
            </div>
            {created.tutorId && (
              <div>
                <p className="text-white/50">Tutor ID (6 digits)</p>
                <p className="font-mono text-explore-teal">{created.tutorId}</p>
              </div>
            )}
            {created.staffId && (
              <div>
                <p className="text-white/50">Staff ID</p>
                <p className="font-mono text-explore-teal">{created.staffId}</p>
              </div>
            )}
            {created.studentId && (
              <div>
                <p className="text-white/50">Student ID (6 digits)</p>
                <p className="font-mono text-explore-teal">{created.studentId}</p>
              </div>
            )}
          </div>
          <p className="text-sm text-white/70">{created.loginHint}</p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/users"
              className="rounded-lg bg-explore-lime px-4 py-2 text-sm font-semibold text-explore-black"
            >
              Back to Users
            </Link>
            <button
              type="button"
              onClick={() => {
                setCreated(null);
                setName("");
                setEmail("");
                setPhone("");
                setPassword(generateAccountPassword());
              }}
              className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-white"
            >
              Create Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <PageHeader
        title="Create User Account"
        description="Add a parent, student, or staff member. Set their email and password here."
      />

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <FormSection title="Account Type">
        <div className="grid gap-3 sm:grid-cols-2">
          {ROLE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={`cursor-pointer rounded-xl border p-4 transition ${
                role === opt.value
                  ? "border-explore-teal bg-explore-teal/10"
                  : "border-white/10 bg-white/5 hover:border-white/20"
              }`}
            >
              <input
                type="radio"
                name="role"
                value={opt.value}
                checked={role === opt.value}
                onChange={() => setRole(opt.value)}
                className="sr-only"
              />
              <p className="font-semibold text-white">{opt.label}</p>
              <p className="mt-1 text-xs text-white/50">{opt.description}</p>
            </label>
          ))}
        </div>
      </FormSection>

      <FormSection title="Basic Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="Full Name" required>
            <TextInput value={name} onChange={(e) => setName(e.target.value)} required />
          </FormField>
          <FormField label="Email" required>
            <TextInput
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Phone">
            <TextInput value={phone} onChange={(e) => setPhone(e.target.value)} />
          </FormField>
        </div>
      </FormSection>

      <FormSection title="Login Password">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] flex-1">
            <FormField label="Password" required>
              <TextInput
                type="text"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
            </FormField>
          </div>
          <button
            type="button"
            onClick={handleGeneratePassword}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/5"
          >
            <KeyRound className="h-4 w-4" />
            Generate
          </button>
          <button
            type="button"
            onClick={() => void handleCopyPassword()}
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/5"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="mt-2 text-xs text-white/50">
          Minimum 8 characters. Share this password securely with the new user.
        </p>
      </FormSection>

      {isStaffRole && (
        <FormSection title="Staff Profile">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Job Title">
              <TextInput value={staffTitle} onChange={(e) => setStaffTitle(e.target.value)} />
            </FormField>
          </div>
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-white/70">Staff categories</p>
            <div className="flex flex-wrap gap-2">
              {STAFF_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    staffCategories.includes(cat)
                      ? "bg-explore-teal text-white"
                      : "bg-white/10 text-white/60"
                  }`}
                >
                  {STAFF_CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-white/80">
              <input
                type="checkbox"
                checked={messagingAvailable}
                onChange={(e) => setMessagingAvailable(e.target.checked)}
                className="h-4 w-4 rounded border-white/20 bg-white/5 text-explore-teal"
              />
              Available for parent messages
            </label>
          </div>
        </FormSection>
      )}

      {isStudent && (
        <FormSection title="Student Details (optional)">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField label="Date of Birth">
              <TextInput
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
            </FormField>
            <FormField label="School Status">
              <select
                value={schoolStatus}
                onChange={(e) => setSchoolStatus(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
              >
                <option value="">Select…</option>
                <option value="homeschool">Homeschool</option>
                <option value="traditional">Traditional</option>
                <option value="other">Other</option>
              </select>
            </FormField>
          </div>
        </FormSection>
      )}

      <FormSection title="Account Status">
        <div className="sm:col-span-2 space-y-3">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={emailVerified}
              onChange={(e) => setEmailVerified(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-explore-teal"
            />
            Email verified (skip verification step)
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-white/80">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="h-4 w-4 rounded border-white/20 bg-white/5 text-explore-teal"
            />
            Account active
          </label>
        </div>
      </FormSection>

      <FormActions
        isSubmitting={submitting}
        submitLabel="Create Account"
        cancelHref="/admin/users"
      />
    </form>
  );
}
