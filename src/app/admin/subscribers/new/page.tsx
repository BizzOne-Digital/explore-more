"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, User, Save } from "lucide-react";
import Link from "next/link";

export default function NewSubscriberPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [verified, setVerified] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/subscribers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          name: name.trim() || undefined,
          verified,
        }),
      });

      const data = await res.json();

      if (!data.success) {
        setError(data.error || "Failed to add subscriber");
        setLoading(false);
        return;
      }

      router.push("/admin/subscribers");
      router.refresh();
    } catch (err) {
      setError("Failed to add subscriber");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/subscribers"
          className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white">Add Subscriber</h1>
          <p className="mt-1 text-white/60">Manually add a new newsletter subscriber</p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Email */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <label className="mb-2 block text-sm font-medium text-white/80">
            Email Address <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="subscriber@example.com"
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-3 text-white placeholder:text-white/30 focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
              required
            />
          </div>
          <p className="mt-2 text-xs text-white/40">
            The email address where newsletters will be sent
          </p>
        </div>

        {/* Name */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <label className="mb-2 block text-sm font-medium text-white/80">
            Name <span className="text-white/40">(Optional)</span>
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-10 pr-3 text-white placeholder:text-white/30 focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
            />
          </div>
          <p className="mt-2 text-xs text-white/40">
            Optional name for personalized newsletters
          </p>
        </div>

        {/* Verified Status */}
        <div className="rounded-lg border border-white/10 bg-white/5 p-6">
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              checked={verified}
              onChange={(e) => setVerified(e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-white/20 bg-white/10 text-explore-teal focus:ring-explore-teal"
            />
            <div className="flex-1">
              <span className="block text-sm font-medium text-white/80">
                Mark as Verified
              </span>
              <p className="mt-1 text-xs text-white/40">
                Manually added subscribers are typically verified by default since the admin is
                adding them directly. Uncheck if you want to require email verification.
              </p>
            </div>
          </label>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 rounded-lg border border-white/10 bg-white/5 p-6">
          <Link
            href="/admin/subscribers"
            className="rounded-lg border border-white/20 bg-white/10 px-6 py-2 text-sm font-medium text-white transition hover:bg-white/20"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 rounded-lg bg-explore-teal px-6 py-2 text-sm font-medium text-white transition hover:bg-explore-teal/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {loading ? "Adding..." : "Add Subscriber"}
          </button>
        </div>
      </form>
    </div>
  );
}
