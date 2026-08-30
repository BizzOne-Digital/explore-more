"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader } from "lucide-react";
import { TutorSessionForm } from "@/components/tutor/TutorSessionForm";

type StudentDetail = {
  assignment: {
    id: string;
    subjects: string[];
    scheduleNotes?: string;
    learningGoals?: string;
    tutorNotes?: string;
  };
  student: {
    id: string;
    name: string;
    studentId?: string;
    grade?: string;
    bio?: string;
  };
  guardians: Array<{
    id: string;
    name?: string;
    email?: string;
    guardianId?: string;
    relationship?: string;
  }>;
  sessions: Array<{
    _id: string;
    sessionDate: string;
    subject: string;
    topicCovered?: string;
    studentProgress?: string;
  }>;
  resources: Array<{
    _id: string;
    title: string;
    type: string;
    createdAt: string;
  }>;
};

export function TutorStudentDetailClient({ studentId }: { studentId: string }) {
  const [detail, setDetail] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/tutor/students/${studentId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Failed to load student");
        setDetail(json);
        setNotes(json.assignment?.tutorNotes ?? "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [studentId]);

  async function saveNotes() {
    setSaving(true);
    try {
      const res = await fetch(`/api/tutor/students/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tutorNotes: notes }),
      });
      if (!res.ok) throw new Error("Failed to save notes");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader className="h-8 w-8 animate-spin text-violet-600" />
      </div>
    );
  }

  if (!detail) {
    return <p className="text-red-600">{error || "Student not found"}</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href="/tutor/students" className="text-sm text-violet-600 hover:underline">
          ← Back to students
        </Link>
        <h2 className="mt-2 font-display text-2xl font-bold">{detail.student.name}</h2>
        <p className="font-mono text-sm text-explore-teal">{detail.student.studentId}</p>
        {detail.student.grade && <p className="text-sm text-gray-500">Grade {detail.student.grade}</p>}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="font-semibold">Subjects Being Tutored</h3>
          <p className="mt-2 text-sm text-gray-600">
            {detail.assignment.subjects.length > 0
              ? detail.assignment.subjects.join(", ")
              : "Not specified"}
          </p>
          {detail.assignment.scheduleNotes && (
            <>
              <h4 className="mt-4 text-sm font-semibold">Tutoring Schedule</h4>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                {detail.assignment.scheduleNotes}
              </p>
            </>
          )}
          {detail.assignment.learningGoals && (
            <>
              <h4 className="mt-4 text-sm font-semibold">Learning Goals</h4>
              <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">
                {detail.assignment.learningGoals}
              </p>
            </>
          )}
        </section>

        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="font-semibold">Parent / Guardian Contact</h3>
          <ul className="mt-3 space-y-3">
            {detail.guardians.map((g) => (
              <li key={g.id} className="text-sm">
                <p className="font-medium">{g.name}</p>
                <p className="text-gray-500">{g.email}</p>
                {g.guardianId && (
                  <p className="font-mono text-xs text-explore-teal">{g.guardianId}</p>
                )}
                <Link
                  href={`/tutor/messages?parent=${g.id}&student=${detail.student.id}`}
                  className="mt-1 inline-block text-violet-600 hover:underline"
                >
                  Message parent
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="font-semibold">Tutor Notes</h3>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          className="mt-3 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder="Private tutoring notes for this student..."
        />
        <button
          type="button"
          onClick={saveNotes}
          disabled={saving}
          className="mt-3 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save notes"}
        </button>
      </section>

      <TutorSessionForm
        studentId={detail.student.id}
        subjects={detail.assignment.subjects}
        onComplete={() => {
          fetch(`/api/tutor/students/${studentId}`)
            .then((r) => r.json())
            .then(setDetail)
            .catch(() => {});
        }}
      />

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="font-semibold">Uploaded Resources</h3>
        {detail.resources.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No resources uploaded yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {detail.resources.map((r) => (
              <li key={r._id} className="text-sm">
                <span className="font-medium">{r.title}</span>
                <span className="ml-2 text-gray-400">({r.type})</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h3 className="font-semibold">Session History</h3>
        {detail.sessions.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">No sessions logged yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {detail.sessions.map((s) => (
              <li key={s._id} className="rounded-lg border border-gray-100 p-3 text-sm">
                <p className="font-medium">
                  {new Date(s.sessionDate).toLocaleDateString()} — {s.subject}
                </p>
                {s.topicCovered && <p className="text-gray-600">{s.topicCovered}</p>}
                {s.studentProgress && (
                  <p className="mt-1 text-gray-500">Progress: {s.studentProgress}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
