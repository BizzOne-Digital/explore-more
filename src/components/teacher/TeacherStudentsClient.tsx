"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type RosterStudent = {
  rosterId: string;
  studentId: string;
  studentName: string;
  email?: string;
  grade?: string;
  className?: string;
};

export function TeacherStudentsClient() {
  const [students, setStudents] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({ name: "", email: "", grade: "", className: "" });
  const [addStatus, setAddStatus] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    setError(null);
    fetch("/api/teacher/roster")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) throw new Error(json.error);
        setStudents(json.students ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    queueMicrotask(() => load());
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold text-explore-charcoal">My Students</h2>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Students on your class roster. Open a profile for attendance, grades, goals, and notes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
        >
          Add student
        </button>
      </div>

      {showAdd && (
        <form
          className="space-y-3 rounded-2xl bg-white p-4 shadow-sm"
          onSubmit={async (e) => {
            e.preventDefault();
            setAddStatus(null);
            const res = await fetch("/api/teacher/roster/students", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(addForm),
            });
            const json = await res.json();
            if (!res.ok) {
              setAddStatus(json.error ?? "Could not add student");
              return;
            }
            setAddForm({ name: "", email: "", grade: "", className: "" });
            setAddStatus("Student added to your roster.");
            load();
          }}
        >
          <input
            required
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="Full name"
            value={addForm.name}
            onChange={(e) => setAddForm((p) => ({ ...p, name: e.target.value }))}
          />
          <input
            required
            type="email"
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="Email (login)"
            value={addForm.email}
            onChange={(e) => setAddForm((p) => ({ ...p, email: e.target.value }))}
          />
          <div className="flex gap-2">
            <input
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Grade"
              value={addForm.grade}
              onChange={(e) => setAddForm((p) => ({ ...p, grade: e.target.value }))}
            />
            <input
              className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
              placeholder="Class"
              value={addForm.className}
              onChange={(e) => setAddForm((p) => ({ ...p, className: e.target.value }))}
            />
          </div>
          <button type="submit" className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white">
            Create & add to roster
          </button>
          {addStatus && <p className="text-sm text-gray-600">{addStatus}</p>}
        </form>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-500">Loading roster…</p>
      ) : students.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
          <p className="text-gray-600">No students on your roster yet.</p>
          <p className="mt-2 text-sm text-gray-500">
            Your administrator can add students to your class from Admin → Users → your teacher
            account → Class roster.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {students.map((s) => (
            <li key={s.rosterId}>
              <Link
                href={`/teacher/students/${s.studentId}`}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3 shadow-sm transition hover:border-violet-200 border border-transparent"
              >
                <span className="font-medium text-explore-charcoal">{s.studentName}</span>
                <span className="text-sm text-gray-500">
                  {[s.grade, s.className].filter(Boolean).join(" · ") || "Class roster"}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
