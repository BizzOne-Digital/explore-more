"use client";

import { useState } from "react";

interface AssignTutorFormProps {
  studentId: string;
  studentName: string;
}

export function AssignTutorForm({ studentId, studentName }: AssignTutorFormProps) {
  const [tutorId, setTutorId] = useState("");
  const [subjects, setSubjects] = useState("");
  const [scheduleNotes, setScheduleNotes] = useState("");
  const [learningGoals, setLearningGoals] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function assign(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");
    try {
      const res = await fetch("/api/admin/tutor-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tutorId: tutorId.trim(),
          studentId,
          subjects: subjects
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          scheduleNotes: scheduleNotes || undefined,
          learningGoals: learningGoals || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || "Assignment failed");
      setMessage(`Tutor assigned to ${studentName} successfully.`);
      setTutorId("");
      setSubjects("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Assignment failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={assign} className="mt-4 space-y-3 rounded-lg border border-white/10 bg-black/20 p-4">
      <h4 className="text-sm font-semibold text-white">Assign Tutor</h4>
      <p className="text-xs text-white/50">
        Enter the tutor&apos;s 6-digit Tutor ID to link them to this student.
      </p>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {message && <p className="text-xs text-green-400">{message}</p>}
      <input
        required
        value={tutorId}
        onChange={(e) => setTutorId(e.target.value)}
        placeholder="Tutor ID (e.g. 482731)"
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
      />
      <input
        value={subjects}
        onChange={(e) => setSubjects(e.target.value)}
        placeholder="Subjects (comma-separated)"
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
      />
      <textarea
        value={scheduleNotes}
        onChange={(e) => setScheduleNotes(e.target.value)}
        placeholder="Tutoring schedule notes"
        rows={2}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
      />
      <textarea
        value={learningGoals}
        onChange={(e) => setLearningGoals(e.target.value)}
        placeholder="Learning goals"
        rows={2}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-explore-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Assigning…" : "Assign tutor"}
      </button>
    </form>
  );
}
