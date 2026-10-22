"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type RosterStudent = { studentId: string; studentName: string };

type PlannerItem = {
  _id: string;
  studentId?: string;
  title: string;
  subject?: string;
  date: string;
  startTime?: string;
  endTime?: string;
};

async function plannerFetch<T>(query: Record<string, string>, init?: RequestInit): Promise<T> {
  const q = `?${new URLSearchParams(query).toString()}`;
  const res = await fetch(`/api/teacher/workspace/planner${q}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

export function TeacherStudentSchedulesClient() {
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [studentId, setStudentId] = useState("");
  const [items, setItems] = useState<PlannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    subject: "",
    date: new Date().toISOString().slice(0, 10),
    startTime: "",
    endTime: "",
  });

  useEffect(() => {
    fetch("/api/teacher/roster")
      .then((r) => r.json())
      .then((json) => {
        const list = (json.students ?? []) as RosterStudent[];
        setRoster(list);
        if (list.length) setStudentId((prev) => prev || list[0].studentId);
      })
      .finally(() => setLoading(false));
  }, []);

  const load = useCallback(() => {
    if (!studentId) {
      setItems([]);
      return;
    }
    const from = new Date();
    from.setDate(from.getDate() - 14);
    const to = new Date();
    to.setDate(to.getDate() + 60);
    plannerFetch<{ items: PlannerItem[] }>({
      studentId,
      from: from.toISOString().slice(0, 10),
      to: to.toISOString().slice(0, 10),
    })
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, [studentId]);

  useEffect(() => {
    queueMicrotask(() => load());
  }, [load]);

  const add = async () => {
    if (!studentId || !form.title.trim()) return;
    await plannerFetch(
      {},
      {
        method: "POST",
        body: JSON.stringify({
          studentId,
          title: form.title.trim(),
          subject: form.subject.trim() || undefined,
          date: form.date,
          startTime: form.startTime.trim() || undefined,
          endTime: form.endTime.trim() || undefined,
          entryType: "lesson",
        }),
      }
    );
    setForm((p) => ({ ...p, title: "", subject: "", startTime: "", endTime: "" }));
    load();
  };

  const remove = async (id: string) => {
    await fetch(`/api/teacher/workspace/planner?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    load();
  };

  const studentName = roster.find((s) => s.studentId === studentId)?.studentName ?? "Student";

  return (
    <div className="space-y-6">
      {loading ? (
        <p className="text-sm text-gray-500">Loading roster…</p>
      ) : roster.length === 0 ? (
        <p className="text-sm text-gray-500">
          Add students to your class roster in Admin before scheduling blocks.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 shadow-sm">
            <label className="text-sm">
              <span className="font-medium text-gray-700">Student</span>
              <select
                className="mt-1 block min-w-[180px] rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
              >
                {roster.map((s) => (
                  <option key={s.studentId} value={s.studentId}>{s.studentName}</option>
                ))}
              </select>
            </label>
            <Link
              href={`/teacher/students/${studentId}`}
              className="text-sm text-violet-700 hover:underline"
            >
              Open {studentName}&apos;s profile
            </Link>
          </div>

          <div className="space-y-2 rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-sm font-medium text-gray-700">Add schedule block</p>
            <div className="flex flex-wrap gap-2">
              <input
                className="min-w-[140px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="Title"
                value={form.title}
                onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
              />
              <input
                className="w-28 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="Subject"
                value={form.subject}
                onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
              />
              <input
                type="date"
                className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={form.date}
                onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              />
              <input
                className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="Start"
                value={form.startTime}
                onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
              />
              <input
                className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                placeholder="End"
                value={form.endTime}
                onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
              />
              <button
                type="button"
                onClick={add}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
              >
                Add block
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Blocks sync with Calendar &amp; Teacher Planner for this school year.
            </p>
          </div>

          <ul className="space-y-2">
            {items.map((item) => (
              <li
                key={item._id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3 text-sm shadow-sm"
              >
                <span>
                  <strong>{item.title}</strong>
                  {item.subject ? ` · ${item.subject}` : ""}
                  {item.startTime ? ` · ${item.startTime}` : ""}
                  {item.endTime ? `–${item.endTime}` : ""}
                  <span className="ml-2 text-gray-500">
                    {new Date(item.date).toLocaleDateString()}
                  </span>
                </span>
                <button
                  type="button"
                  className="text-xs text-red-600"
                  onClick={() => remove(item._id)}
                >
                  Delete
                </button>
              </li>
            ))}
            {items.length === 0 && (
              <li className="text-sm text-gray-500">No upcoming blocks for this student.</li>
            )}
          </ul>
        </>
      )}
    </div>
  );
}
