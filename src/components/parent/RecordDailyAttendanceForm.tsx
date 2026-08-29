"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarPlus, Loader } from "lucide-react";
import { PARENT_DAILY_STATUS_OPTIONS } from "@/lib/attendance/status";

export function RecordDailyAttendanceForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<string>("present");
  const [customLabel, setCustomLabel] = useState("");
  const [notes, setNotes] = useState("");
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
        body: JSON.stringify({
          studentId,
          sessionDate,
          status,
          customLabel: status === "other" ? customLabel : undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to save attendance");

      setMessage(data.data?.message ?? "Daily attendance saved.");
      if (status !== "other") setCustomLabel("");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save attendance");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm space-y-4 border border-explore-teal/15">
      <div className="flex items-center gap-2">
        <CalendarPlus className="h-5 w-5 text-explore-teal" />
        <h3 className="font-semibold text-explore-charcoal">Record Daily Attendance</h3>
      </div>
      <p className="text-sm text-explore-charcoal/60">
        Log each homeschool day for your child. You can update the same date if you need to change it.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-explore-charcoal/70">Date</label>
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            required
            max={new Date().toISOString().slice(0, 10)}
            className="w-full rounded-lg border border-explore-charcoal/20 px-4 py-2"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-explore-charcoal/70">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            required
            className="w-full rounded-lg border border-explore-charcoal/20 px-4 py-2"
          >
            {PARENT_DAILY_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        {status === "other" && (
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium text-explore-charcoal/70">
              Custom status
            </label>
            <input
              type="text"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              required
              placeholder="e.g. Half day, Doctor appointment, Co-op day"
              className="w-full rounded-lg border border-explore-charcoal/20 px-4 py-2"
            />
          </div>
        )}
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-explore-charcoal/70">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Any additional details for this day…"
            className="w-full rounded-lg border border-explore-charcoal/20 px-4 py-2"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}

      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-explore-teal px-4 py-2 text-sm font-semibold text-white hover:bg-explore-teal/90 disabled:opacity-50"
      >
        {loading && <Loader className="h-4 w-4 animate-spin" />}
        Save Attendance
      </button>
    </form>
  );
}
