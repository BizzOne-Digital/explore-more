"use client";

import { useState } from "react";
import { FileText, Loader } from "lucide-react";

export function AttendanceExcuseForm({ studentId }: { studentId: string }) {
  const [sessionDate, setSessionDate] = useState("");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch("/api/parent/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, sessionDate, note }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to submit excuse");

      setMessage("Absence excuse submitted successfully.");
      setSessionDate("");
      setNote("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-explore-teal" />
        <h3 className="font-semibold text-explore-charcoal">Submit Absence / Excuse Note</h3>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-explore-charcoal/70">Session Date</label>
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            required
            className="w-full rounded-lg border border-explore-charcoal/20 px-4 py-2"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-explore-charcoal/70">Explanation</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            required
            rows={3}
            placeholder="Describe the absence or reason for excusal..."
            className="w-full rounded-lg border border-explore-charcoal/20 px-4 py-2"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-explore-sand px-4 py-2 text-sm font-semibold text-explore-charcoal hover:bg-explore-sand/80 disabled:opacity-50"
      >
        {loading && <Loader className="h-4 w-4 animate-spin" />}
        Submit Excuse Note
      </button>
    </form>
  );
}
