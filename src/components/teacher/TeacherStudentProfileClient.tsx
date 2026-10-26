"use client";

import Link from "next/link";
import { useState } from "react";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "attendance", label: "Attendance", href: (id: string) => `/teacher/attendance?studentId=${id}` },
  { id: "grades", label: "Grades", href: (id: string) => `/teacher/gradebook?studentId=${id}` },
  { id: "assessments", label: "Assessments", href: (id: string) => `/teacher/assessments?studentId=${id}` },
  { id: "goals", label: "Goals", href: (id: string) => `/teacher/goals?studentId=${id}` },
  { id: "interventions", label: "Interventions", href: (id: string) => `/teacher/interventions?studentId=${id}` },
  { id: "behavior", label: "Behavior", href: (id: string) => `/teacher/behavior?studentId=${id}` },
  { id: "notes", label: "Teacher notes", href: (id: string) => `/teacher/notes?studentId=${id}` },
  { id: "schedules", label: "Schedules", href: (id: string) => `/teacher/student-schedules?studentId=${id}` },
] as const;

export function TeacherStudentProfileClient({
  studentId,
  studentName,
  grade,
  className,
  email,
  hubSummary,
}: {
  studentId: string;
  studentName: string;
  grade?: string;
  className?: string;
  email?: string;
  hubSummary?: React.ReactNode;
}) {
  const [tab, setTab] = useState<string>("overview");

  return (
    <div className="space-y-6">
      <div>
        <Link href="/teacher/students" className="text-sm text-violet-700 hover:underline">
          ← All students
        </Link>
        <h2 className="mt-2 font-display text-2xl font-bold text-explore-charcoal">{studentName}</h2>
        <p className="mt-1 text-sm text-gray-500">
          {[grade, className, email].filter(Boolean).join(" · ")}
        </p>
      </div>

      <nav className="flex flex-wrap gap-2 border-b border-gray-200 pb-2">
        {TABS.map((t) =>
          t.id === "overview" ? (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab("overview")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                tab === "overview" ? "bg-violet-600 text-white" : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {t.label}
            </button>
          ) : (
            <Link
              key={t.id}
              href={t.href!(studentId)}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-violet-700 hover:bg-violet-50"
            >
              {t.label}
            </Link>
          )
        )}
      </nav>

      {tab === "overview" && (
        <div className="space-y-4">
          {hubSummary}
          <p className="text-sm text-gray-600">
            Use the tabs above to open attendance, grades, assessments, goals, interventions, behavior, and
            notes filtered to this student. Parent information and health records will expand here as admin
            fields are connected.
          </p>
        </div>
      )}
    </div>
  );
}
