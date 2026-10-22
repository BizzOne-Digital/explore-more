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
      <div>
        <h2 className="font-display text-2xl font-bold text-explore-charcoal">My Students</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">
          Students on your school class roster. Select a student to view progress links, attendance,
          and records.
        </p>
      </div>

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
