"use client";

import { useState } from "react";

interface TutorSessionFormProps {
  studentId: string;
  subjects: string[];
  onComplete?: () => void;
}

export function TutorSessionForm({ studentId, subjects, onComplete }: TutorSessionFormProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    sessionDate: new Date().toISOString().slice(0, 10),
    subject: subjects[0] ?? "",
    topicCovered: "",
    workedOn: "",
    studentProgress: "",
    areasNeedingPractice: "",
    homeworkAssigned: "",
    privateStaffNotes: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/tutor/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, ...form }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to save session");
      setOpen(false);
      onComplete?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl bg-explore-teal px-5 py-3 text-sm font-semibold text-white"
      >
        Complete Session
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white p-5 shadow-sm space-y-4">
      <h3 className="font-semibold">Complete Tutoring Session</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          Date
          <input
            type="date"
            required
            value={form.sessionDate}
            onChange={(e) => setForm({ ...form, sessionDate: e.target.value })}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
        <label className="text-sm">
          Subject
          <input
            required
            value={form.subject}
            onChange={(e) => setForm({ ...form, subject: e.target.value })}
            className="mt-1 w-full rounded-lg border px-3 py-2"
            list="tutor-subjects"
          />
          <datalist id="tutor-subjects">
            {subjects.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </label>
      </div>

      {[
        ["topicCovered", "Topic Covered"],
        ["workedOn", "What We Worked On"],
        ["studentProgress", "Student Progress"],
        ["areasNeedingPractice", "Areas Needing Practice"],
        ["homeworkAssigned", "Homework / Resources Assigned"],
        ["privateStaffNotes", "Private Staff Notes"],
      ].map(([key, label]) => (
        <label key={key} className="block text-sm">
          {label}
          <textarea
            value={form[key as keyof typeof form]}
            onChange={(e) => setForm({ ...form, [key]: e.target.value })}
            rows={2}
            className="mt-1 w-full rounded-lg border px-3 py-2"
          />
        </label>
      ))}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Saving…" : "Save session report"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border px-4 py-2 text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
