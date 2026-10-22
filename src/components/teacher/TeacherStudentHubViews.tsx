"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type OverviewStudent = {
  studentId: string;
  studentName: string;
  grade?: string;
  className?: string;
  assessmentCount: number;
  gradeEntryCount: number;
  recordCount: number;
};

export function TeacherProgressOverview() {
  const [students, setStudents] = useState<OverviewStudent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    fetch("/api/teacher/students/overview")
      .then((r) => r.json())
      .then((d) => setStudents(d.students ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    queueMicrotask(() => load());
  }, [load]);

  return (
    <HubShell
      title="Student progress"
      description="Unified view across attendance, grades, assessments, goals, and schedules (open a student for full sync)."
    >
      {loading ? (
        <p className="text-sm text-gray-500">Loading roster…</p>
      ) : students.length === 0 ? (
        <p className="text-sm text-gray-500">Add students to your class roster to see progress.</p>
      ) : (
        <ul className="space-y-2">
          {students.map((s) => (
            <li key={s.studentId}>
              <Link
                href={`/teacher/students/${s.studentId}`}
                className="flex flex-wrap justify-between gap-2 rounded-xl bg-white px-4 py-3 shadow-sm hover:border-violet-200 border border-transparent"
              >
                <span className="font-medium">{s.studentName}</span>
                <span className="text-xs text-gray-500">
                  {s.assessmentCount} assessments · {s.gradeEntryCount} grades · {s.recordCount}{" "}
                  records
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </HubShell>
  );
}

export function TeacherPortfoliosOverview() {
  return (
    <TeacherProgressOverview />
  );
}

export function TeacherReportsHub() {
  return (
    <HubShell
      title="Reports"
      description="Progress summaries and academy reporting entry points."
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <Link
          href="/teacher/progress"
          className="rounded-xl bg-white p-4 shadow-sm hover:border-violet-200 border border-transparent"
        >
          <p className="font-semibold">Student progress</p>
          <p className="mt-1 text-sm text-gray-500">Roster overview with synced counts</p>
        </Link>
        <Link
          href="/teacher/gradebook"
          className="rounded-xl bg-white p-4 shadow-sm hover:border-violet-200 border border-transparent"
        >
          <p className="font-semibold">Gradebook</p>
          <p className="mt-1 text-sm text-gray-500">Assignments and class scores</p>
        </Link>
        <Link
          href="/teacher/attendance"
          className="rounded-xl bg-white p-4 shadow-sm hover:border-violet-200 border border-transparent"
        >
          <p className="font-semibold">Attendance</p>
          <p className="mt-1 text-sm text-gray-500">Daily attendance by student</p>
        </Link>
        <Link
          href="/teacher/assessments"
          className="rounded-xl bg-white p-4 shadow-sm hover:border-violet-200 border border-transparent"
        >
          <p className="font-semibold">Assessments</p>
          <p className="mt-1 text-sm text-gray-500">Per-student assessment history</p>
        </Link>
      </div>
    </HubShell>
  );
}

function HubShell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-display text-2xl font-bold text-explore-charcoal">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">{description}</p>
      </div>
      {children}
    </div>
  );
}
