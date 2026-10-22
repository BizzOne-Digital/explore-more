"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, UserPlus, X } from "lucide-react";

type RosterRow = {
  rosterId: string;
  studentId: string;
  studentName: string;
  grade?: string;
  className?: string;
};

type StudentOption = { _id: string; name: string; email: string };

export function TeacherRosterManager({ teacherUserId }: { teacherUserId: string }) {
  const [roster, setRoster] = useState<RosterRow[]>([]);
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [studentId, setStudentId] = useState("");
  const [grade, setGrade] = useState("");
  const [className, setClassName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadRoster = useCallback(() => {
    fetch(`/api/admin/teachers/${teacherUserId}/roster`)
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setRoster(json.data?.students ?? []);
      })
      .finally(() => setLoading(false));
  }, [teacherUserId]);

  useEffect(() => {
    queueMicrotask(() => loadRoster());
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) {
          const list = (json.data ?? []) as Array<StudentOption & { role?: string }>;
          setStudents(list.filter((u) => u.role === "student"));
        }
      })
      .catch(() => {});
  }, [loadRoster]);

  async function addStudent() {
    if (!studentId) {
      setError("Select a student.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/teachers/${teacherUserId}/roster`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId,
          grade: grade.trim() || undefined,
          className: className.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Add failed");
      setStudentId("");
      setGrade("");
      setClassName("");
      setMessage("Student added to class roster.");
      loadRoster();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Add failed");
    } finally {
      setSaving(false);
    }
  }

  async function remove(rosterId: string) {
    if (!confirm("Remove this student from the teacher’s roster?")) return;
    const res = await fetch(
      `/api/admin/teachers/${teacherUserId}/roster?rosterId=${rosterId}`,
      { method: "DELETE" }
    );
    const json = await res.json();
    if (json.success) loadRoster();
    else setError(json.error ?? "Remove failed");
  }

  return (
    <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-6">
      <h3 className="text-lg font-semibold text-white">Class roster</h3>
      <p className="mt-1 text-sm text-white/55">
        Students here appear in this teacher’s attendance, assessments, and My Students list.
      </p>

      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}
      {message && <p className="mt-3 text-sm text-emerald-300">{message}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        <select
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          className="min-w-[200px] flex-1 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
        >
          <option value="">Select student…</option>
          {students.map((s) => (
            <option key={s._id} value={s._id}>
              {s.name} ({s.email})
            </option>
          ))}
        </select>
        <input
          placeholder="Grade"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          className="w-24 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
        />
        <input
          placeholder="Class"
          value={className}
          onChange={(e) => setClassName(e.target.value)}
          className="w-32 rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
        />
        <button
          type="button"
          onClick={addStudent}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-explore-teal px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          Add to roster
        </button>
      </div>

      {loading ? (
        <p className="mt-4 text-sm text-white/50">Loading roster…</p>
      ) : roster.length === 0 ? (
        <p className="mt-4 text-sm text-white/50">No students on this teacher’s roster.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {roster.map((row) => (
            <li
              key={row.rosterId}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-black/25 px-3 py-2 text-sm text-white/90"
            >
              <span>
                {row.studentName}
                <span className="ml-2 text-white/45">
                  {[row.grade, row.className].filter(Boolean).join(" · ")}
                </span>
              </span>
              <button
                type="button"
                onClick={() => remove(row.rosterId)}
                className="text-red-300 hover:text-red-200"
                aria-label="Remove from roster"
              >
                <X className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
