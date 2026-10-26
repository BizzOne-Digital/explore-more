"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { WorkspacePageConfig } from "@/lib/tutor/workspace-pages";

type PlannerEntry = {
  _id: string;
  title: string;
  subject?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  classroom?: string;
  lessonPlanId?: string;
  notes?: string;
};

type LessonOption = { _id: string; title: string };

async function workspaceFetch<T>(
  apiModule: string,
  init?: RequestInit & { query?: Record<string, string> }
): Promise<T> {
  const q = init?.query ? `?${new URLSearchParams(init.query).toString()}` : "";
  const res = await fetch(`/api/teacher/workspace/${apiModule}${q}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

function mondayOf(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function monthStart(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function monthEnd(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  d.setMonth(d.getMonth() + 1, 0);
  return d.toISOString().slice(0, 10);
}

const emptyForm = () => ({
  title: "",
  subject: "",
  date: new Date().toISOString().slice(0, 10),
  startTime: "",
  endTime: "",
  classroom: "",
  lessonPlanId: "",
  notes: "",
});

export function PlannerView({
  config,
}: {
  config: WorkspacePageConfig;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [anchorDate, setAnchorDate] = useState(today);
  const [items, setItems] = useState<PlannerEntry[]>([]);
  const [lessons, setLessons] = useState<LessonOption[]>([]);
  const [addForm, setAddForm] = useState(emptyForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, ReturnType<typeof emptyForm>>>({});

  const range = useMemo(() => {
    if (view === "day") return { from: anchorDate, to: anchorDate };
    if (view === "week") {
      const start = mondayOf(anchorDate);
      return { from: start, to: addDays(start, 6) };
    }
    return { from: monthStart(anchorDate), to: monthEnd(anchorDate) };
  }, [view, anchorDate]);

  const load = useCallback(() => {
    workspaceFetch<{ items: PlannerEntry[] }>("planner", { query: range })
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, [range]);

  useEffect(() => {
    queueMicrotask(() => load());
  }, [load]);

  useEffect(() => {
    workspaceFetch<{ items: Array<{ _id: string; title: string }> }>("lesson-plans")
      .then((d) =>
        setLessons((d.items ?? []).map((p) => ({ _id: String(p._id), title: String(p.title) })))
      )
      .catch(() => setLessons([]));
  }, []);

  useEffect(() => {
    queueMicrotask(() => {
      const next: Record<string, ReturnType<typeof emptyForm>> = {};
      for (const item of items) {
        next[item._id] = {
          title: item.title ?? "",
          subject: item.subject ?? "",
          date: String(item.date).slice(0, 10),
          startTime: item.startTime ?? "",
          endTime: item.endTime ?? "",
          classroom: item.classroom ?? "",
          lessonPlanId: item.lessonPlanId ? String(item.lessonPlanId) : "",
          notes: item.notes ?? "",
        };
      }
      setDrafts(next);
    });
  }, [items]);

  const add = async () => {
    if (!addForm.title.trim()) return;
    await workspaceFetch("planner", {
      method: "POST",
      body: JSON.stringify({
        ...addForm,
        lessonPlanId: addForm.lessonPlanId || undefined,
      }),
    });
    setAddForm(emptyForm());
    load();
  };

  const save = async (id: string) => {
    const row = drafts[id];
    if (!row) return;
    await workspaceFetch("planner", {
      method: "PATCH",
      body: JSON.stringify({
        id,
        ...row,
        lessonPlanId: row.lessonPlanId || undefined,
      }),
    });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this planner block?")) return;
    await workspaceFetch("planner", { method: "DELETE", query: { id } });
    load();
  };

  const duplicate = async (id: string) => {
    const row = drafts[id];
    if (!row) return;
    await workspaceFetch("planner", {
      method: "POST",
      body: JSON.stringify({
        ...row,
        title: `${row.title} (copy)`,
        lessonPlanId: row.lessonPlanId || undefined,
      }),
    });
    load();
  };

  const printEntry = (id: string) => {
    const row = drafts[id];
    if (!row) return;
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(
      `<html><head><title>${row.title}</title></head><body style="font-family:sans-serif;padding:24px">
      <h1>${row.title}</h1>
      <p>${row.subject || ""} · ${row.date} · ${row.startTime || ""}${row.endTime ? `–${row.endTime}` : ""}</p>
      <p>Classroom: ${row.classroom || "—"}</p>
      <pre style="white-space:pre-wrap">${row.notes || ""}</pre>
      </body></html>`
    );
    w.document.close();
    w.print();
  };

  const sorted = [...items].sort((a, b) => {
    const da = String(a.date).slice(0, 10);
    const db = String(b.date).slice(0, 10);
    if (da !== db) return da.localeCompare(db);
    return (a.startTime ?? "").localeCompare(b.startTime ?? "");
  });

  const timeLabel = (e: PlannerEntry) => {
    if (e.startTime && e.endTime) return `${e.startTime}–${e.endTime}`;
    if (e.startTime) return e.startTime;
    return "—";
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-explore-charcoal">{config.title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">{config.description}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-white p-4 shadow-sm">
        {(["day", "week", "month"] as const).map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium capitalize ${
              view === v ? "bg-violet-600 text-white" : "border border-gray-200 text-gray-700"
            }`}
          >
            {v}
          </button>
        ))}
        <input
          type="date"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          value={anchorDate}
          onChange={(e) => setAnchorDate(e.target.value)}
        />
        <button
          type="button"
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
          onClick={() => setAnchorDate(today)}
        >
          Today
        </button>
        <span className="text-sm text-gray-500">
          {range.from} → {range.to}
        </span>
      </div>

      <div className="grid gap-2 rounded-2xl bg-white p-4 shadow-sm md:grid-cols-4">
        <input
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm md:col-span-2"
          placeholder="Block title *"
          value={addForm.title}
          onChange={(e) => setAddForm((p) => ({ ...p, title: e.target.value }))}
        />
        <input
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder="Subject"
          value={addForm.subject}
          onChange={(e) => setAddForm((p) => ({ ...p, subject: e.target.value }))}
        />
        <input
          type="date"
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          value={addForm.date}
          onChange={(e) => setAddForm((p) => ({ ...p, date: e.target.value }))}
        />
        <input
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder="Start (8:30 AM)"
          value={addForm.startTime}
          onChange={(e) => setAddForm((p) => ({ ...p, startTime: e.target.value }))}
        />
        <input
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder="End (9:30 AM)"
          value={addForm.endTime}
          onChange={(e) => setAddForm((p) => ({ ...p, endTime: e.target.value }))}
        />
        <input
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder="Classroom"
          value={addForm.classroom}
          onChange={(e) => setAddForm((p) => ({ ...p, classroom: e.target.value }))}
        />
        <select
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm md:col-span-2"
          value={addForm.lessonPlanId}
          onChange={(e) => setAddForm((p) => ({ ...p, lessonPlanId: e.target.value }))}
        >
          <option value="">Link lesson plan (optional)</option>
          {lessons.map((l) => (
            <option key={l._id} value={l._id}>{l.title}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={add}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white md:col-span-4"
        >
          Add block
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="border-b border-gray-100 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3">Time</th>
              <th className="px-4 py-3">Subject</th>
              <th className="px-4 py-3">Activity</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Classroom</th>
              <th className="px-4 py-3">Lesson plan</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((e) => {
              const row = drafts[e._id];
              const open = expandedId === e._id;
              return (
                <tr key={e._id} className="border-b border-gray-50 align-top">
                  <td className="px-4 py-3 whitespace-nowrap">{timeLabel(e)}</td>
                  <td className="px-4 py-3">{e.subject || "—"}</td>
                  <td className="px-4 py-3 font-medium">{e.title}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {new Date(String(e.date)).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">{e.classroom || "—"}</td>
                  <td className="px-4 py-3">
                    {e.lessonPlanId ? (
                      <Link
                        href={`/teacher/lesson-plans/${e.lessonPlanId}`}
                        className="text-violet-700 hover:underline"
                      >
                        Open plan
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2 text-xs">
                      <button type="button" className="text-violet-700" onClick={() => setExpandedId(open ? null : e._id)}>
                        {open ? "Close" : "Edit"}
                      </button>
                      <button type="button" className="text-violet-700" onClick={() => duplicate(e._id)}>
                        Duplicate
                      </button>
                      <button type="button" className="text-violet-700" onClick={() => printEntry(e._id)}>
                        Print
                      </button>
                      <button type="button" className="text-red-600" onClick={() => remove(e._id)}>
                        Delete
                      </button>
                    </div>
                    {open && row && (
                      <div className="mt-3 grid gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <input
                          className="rounded border border-gray-200 px-2 py-1"
                          value={row.title}
                          onChange={(ev) =>
                            setDrafts((p) => ({ ...p, [e._id]: { ...row, title: ev.target.value } }))
                          }
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            className="rounded border border-gray-200 px-2 py-1"
                            placeholder="Start"
                            value={row.startTime}
                            onChange={(ev) =>
                              setDrafts((p) => ({ ...p, [e._id]: { ...row, startTime: ev.target.value } }))
                            }
                          />
                          <input
                            className="rounded border border-gray-200 px-2 py-1"
                            placeholder="End"
                            value={row.endTime}
                            onChange={(ev) =>
                              setDrafts((p) => ({ ...p, [e._id]: { ...row, endTime: ev.target.value } }))
                            }
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => save(e._id)}
                          className="rounded bg-violet-600 px-3 py-1 text-white"
                        >
                          Save changes
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <p className="p-6 text-center text-sm text-gray-500">No planner blocks in this range.</p>
        )}
      </div>

      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/teacher/calendar" className="text-violet-700 hover:underline">Calendar</Link>
        <Link href="/teacher/student-schedules" className="text-violet-700 hover:underline">Student schedules</Link>
        <Link href="/teacher/substitute" className="text-violet-700 hover:underline">Substitute Center</Link>
      </div>
    </div>
  );
}
