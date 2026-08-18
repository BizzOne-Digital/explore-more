"use client";

import { useState } from "react";
import { UserPlus, Loader } from "lucide-react";

export function LinkChildForm({ onSuccess }: { onSuccess?: () => void }) {
  const [studentIdCode, setStudentIdCode] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [relationship, setRelationship] = useState("Parent");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/parent/link-child", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentIdCode, dateOfBirth: dateOfBirth || undefined, relationship }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to link student");

      setSuccess(data.data?.message ?? "Request submitted.");
      setStudentIdCode("");
      setDateOfBirth("");
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link student");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <UserPlus className="h-5 w-5 text-explore-teal" />
        <h3 className="font-display text-lg font-bold text-explore-charcoal">Link Your Student</h3>
      </div>
      <p className="text-sm text-explore-charcoal/70">
        Enter your child&apos;s 6-digit Explore More Academy Student ID. For security, also provide their date of birth
        when available, or staff will approve the link.
      </p>

      <div>
        <label className="block text-sm font-medium text-explore-charcoal/70 mb-1">Student ID</label>
        <input
          type="text"
          value={studentIdCode}
          onChange={(e) => setStudentIdCode(e.target.value)}
          placeholder="e.g. 482917"
          required
          className="w-full rounded-lg border border-explore-charcoal/20 px-4 py-2.5"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-explore-charcoal/70 mb-1">
          Child&apos;s Date of Birth (recommended)
        </label>
        <input
          type="date"
          value={dateOfBirth}
          onChange={(e) => setDateOfBirth(e.target.value)}
          className="w-full rounded-lg border border-explore-charcoal/20 px-4 py-2.5"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-explore-charcoal/70 mb-1">Your Relationship</label>
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
      {success && <p className="text-sm text-green-700">{success}</p>}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-explore-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-explore-teal/90 disabled:opacity-50"
      >
        {loading ? <Loader className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
        Verify &amp; Link Student
      </button>
    </form>
  );
}
