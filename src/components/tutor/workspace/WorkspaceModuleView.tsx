"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  WORKSPACE_PAGE_CONFIG,
  type WorkspacePageConfig,
} from "@/lib/tutor/workspace-pages";

type StudentOption = { studentId: string; studentName: string };

async function workspaceFetch<T>(
  apiModule: string,
  init?: RequestInit & { query?: Record<string, string> }
): Promise<T> {
  const q = init?.query
    ? `?${new URLSearchParams(init.query).toString()}`
    : "";
  const res = await fetch(`/api/tutor/workspace/${apiModule}${q}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

function Shell({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-explore-charcoal">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-gray-500">{description}</p>
      </div>
      {children}
    </div>
  );
}

function PlaceholderView({ config }: { config: WorkspacePageConfig }) {
  return (
    <Shell title={config.title} description={config.description}>
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
        <p className="text-gray-600">
          This area is wired into the Teacher Workspace navigation. Use the links below for related
          tools today.
        </p>
        {config.placeholderLinks && config.placeholderLinks.length > 0 && (
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {config.placeholderLinks.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </Shell>
  );
}

function CalendarView({ config }: { config: WorkspacePageConfig }) {
  return (
    <Shell title={config.title} description={config.description}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/tutor/schedule"
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:border-violet-200"
        >
          <p className="font-semibold text-explore-charcoal">Student schedules</p>
          <p className="mt-1 text-sm text-gray-500">View tutoring schedules for assigned students.</p>
        </Link>
        <Link
          href="/tutor/planner"
          className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:border-violet-200"
        >
          <p className="font-semibold text-explore-charcoal">Teacher planner</p>
          <p className="mt-1 text-sm text-gray-500">Plan lessons and blocks on your calendar.</p>
        </Link>
      </div>
    </Shell>
  );
}

const CLASSROOM_FIELDS: { key: string; label: string; rows?: number }[] = [
  { key: "className", label: "Class name" },
  { key: "grade", label: "Grade" },
  { key: "room", label: "Room" },
  { key: "subjects", label: "Subjects (comma-separated)" },
  { key: "rules", label: "Class rules", rows: 3 },
  { key: "procedures", label: "Procedures", rows: 3 },
  { key: "dailyRoutine", label: "Daily routine", rows: 3 },
  { key: "classroomGoals", label: "Classroom goals", rows: 2 },
  { key: "supplyList", label: "Supply list", rows: 3 },
  { key: "emergencyProcedures", label: "Emergency procedures", rows: 3 },
  { key: "importantDates", label: "Important dates", rows: 2 },
  { key: "notes", label: "Notes for substitutes", rows: 4 },
];

function ClassroomView({ config }: { config: WorkspacePageConfig }) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    workspaceFetch<{ item: Record<string, unknown> | null }>("classroom")
      .then((data) => {
        const item = data.item;
        if (!item) return;
        const next: Record<string, string> = {};
        for (const f of CLASSROOM_FIELDS) {
          const v = item[f.key];
          if (f.key === "subjects" && Array.isArray(v)) next[f.key] = v.join(", ");
          else if (typeof v === "string") next[f.key] = v;
        }
        setForm(next);
      })
      .catch(() => setMessage("Could not load classroom profile."));
  }, []);

  const save = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const subjects = form.subjects
        ? form.subjects.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      await workspaceFetch("classroom", {
        method: "POST",
        body: JSON.stringify({ ...form, subjects }),
      });
      setMessage("Saved.");
    } catch {
      setMessage("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Shell title={config.title} description={config.description}>
      <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        {CLASSROOM_FIELDS.map((f) => (
          <label key={f.key} className="block text-sm">
            <span className="font-medium text-gray-700">{f.label}</span>
            {f.rows ? (
              <textarea
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                rows={f.rows}
                value={form[f.key] ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
              />
            ) : (
              <input
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
                value={form[f.key] ?? ""}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
              />
            )}
          </label>
        ))}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save classroom"}
          </button>
          {message && <span className="text-sm text-gray-500">{message}</span>}
        </div>
      </div>
    </Shell>
  );
}

function RecordsView({ config }: { config: WorkspacePageConfig }) {
  const recordType = config.recordType!;
  const [items, setItems] = useState<Array<{ _id: string; title?: string; body: string; eventDate: string }>>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const load = useCallback(() => {
    workspaceFetch<{ items: typeof items }>("records", {
      query: { recordType },
    })
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, [recordType]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!body.trim()) return;
    await workspaceFetch("records", {
      method: "POST",
      body: JSON.stringify({ recordType, title, body }),
    });
    setTitle("");
    setBody("");
    load();
  };

  const remove = async (id: string) => {
    await workspaceFetch("records", { method: "DELETE", query: { id } });
    load();
  };

  return (
    <Shell title={config.title} description={config.description}>
      <div className="rounded-2xl bg-white p-5 shadow-sm space-y-3">
        <input
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder="Title (optional)"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <textarea
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          rows={3}
          placeholder="Details"
          value={body}
          onChange={(e) => setBody(e.target.value)}
        />
        <button
          type="button"
          onClick={add}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
        >
          Add entry
        </button>
      </div>
      <ul className="space-y-3">
        {items.map((item) => (
          <li key={item._id} className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex justify-between gap-2">
              <div>
                {item.title && <p className="font-semibold">{item.title}</p>}
                <p className="mt-1 whitespace-pre-wrap text-sm text-gray-600">{item.body}</p>
                <p className="mt-2 text-xs text-gray-400">
                  {new Date(item.eventDate).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                className="text-xs text-red-600"
                onClick={() => remove(item._id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

function SimpleListView({
  config,
  apiModule,
  fields,
}: {
  config: WorkspacePageConfig;
  apiModule: string;
  fields: { key: string; label: string; required?: boolean }[];
}) {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [form, setForm] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    const query: Record<string, string> = {};
    if (config.documentFolder) query.folder = config.documentFolder;
    workspaceFetch<{ items: typeof items }>(apiModule, { query })
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, [apiModule, config.documentFolder]);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    const payload: Record<string, unknown> = {};
    for (const f of fields) {
      if (form[f.key]) payload[f.key] = form[f.key];
    }
    if (config.documentFolder) payload.folder = config.documentFolder;
    await workspaceFetch(apiModule, { method: "POST", body: JSON.stringify(payload) });
    setForm({});
    load();
  };

  const remove = async (id: string) => {
    await workspaceFetch(apiModule, { method: "DELETE", query: { id } });
    load();
  };

  const labelFor = (item: Record<string, unknown>) =>
    String(item.title ?? item.tripName ?? item.itemName ?? item.fileName ?? item.standardCode ?? "Item");

  return (
    <Shell title={config.title} description={config.description}>
      <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-4 shadow-sm">
        {fields.map((f) => (
          <input
            key={f.key}
            className="min-w-[140px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder={f.label}
            value={form[f.key] ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
          />
        ))}
        <button
          type="button"
          onClick={add}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
        >
          Add
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li
            key={String(item._id)}
            className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-sm"
          >
            <span className="text-sm font-medium">{labelFor(item)}</span>
            <button
              type="button"
              className="text-xs text-red-600"
              onClick={() => remove(String(item._id))}
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

function TodosView({ config }: { config: WorkspacePageConfig }) {
  return (
    <SimpleListView
      config={config}
      apiModule="todos"
      fields={[
        { key: "title", label: "Task title", required: true },
        { key: "description", label: "Description" },
      ]}
    />
  );
}

function EndOfDayView({ config }: { config: WorkspacePageConfig }) {
  const [form, setForm] = useState({
    todaysWin: "",
    reteach: "",
    studentsNeedingAttention: "",
    tomorrowPriority: "",
    reflection: "",
  });
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    workspaceFetch<{ item: Partial<typeof form> | null }>("end-of-day", {
      query: { date: new Date().toISOString() },
    }).then((d) => {
      if (d.item) {
        setForm((prev) => ({
          todaysWin: d.item!.todaysWin ?? prev.todaysWin,
          reteach: d.item!.reteach ?? prev.reteach,
          studentsNeedingAttention:
            d.item!.studentsNeedingAttention ?? prev.studentsNeedingAttention,
          tomorrowPriority: d.item!.tomorrowPriority ?? prev.tomorrowPriority,
          reflection: d.item!.reflection ?? prev.reflection,
        }));
      }
    });
  }, []);

  const save = async () => {
    await workspaceFetch("end-of-day", { method: "POST", body: JSON.stringify(form) });
    setMessage("Check-out saved for today.");
  };

  const fields = [
    { key: "todaysWin", label: "Today’s win" },
    { key: "reteach", label: "Reteach needed" },
    { key: "studentsNeedingAttention", label: "Students needing attention" },
    { key: "tomorrowPriority", label: "Tomorrow’s priority" },
    { key: "reflection", label: "Reflection" },
  ] as const;

  return (
    <Shell title={config.title} description={config.description}>
      <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        {fields.map((f) => (
          <label key={f.key} className="block text-sm">
            <span className="font-medium text-gray-700">{f.label}</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
              rows={2}
              value={form[f.key]}
              onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
            />
          </label>
        ))}
        <button
          type="button"
          onClick={save}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
        >
          Save check-out
        </button>
        {message && <p className="text-sm text-gray-500">{message}</p>}
      </div>
    </Shell>
  );
}

function AttendanceView({ config }: { config: WorkspacePageConfig }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [statusByStudent, setStatusByStudent] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/tutor/students")
      .then((r) => r.json())
      .then((d) => {
        const list = (d.students ?? d.data?.students ?? []) as Array<{
          studentId: string;
          name?: string;
          studentName?: string;
        }>;
        setStudents(
          list.map((s) => ({
            studentId: s.studentId,
            studentName: s.studentName ?? s.name ?? "Student",
          }))
        );
      })
      .catch(() => setStudents([]));
  }, []);

  useEffect(() => {
    workspaceFetch<{ items: Array<{ studentId: string; status: string }> }>("attendance", {
      query: { date },
    }).then((d) => {
      const map: Record<string, string> = {};
      for (const row of d.items ?? []) {
        map[String(row.studentId)] = row.status;
      }
      setStatusByStudent(map);
    });
  }, [date]);

  const save = async (studentId: string, status: string) => {
    setStatusByStudent((p) => ({ ...p, [studentId]: status }));
    await workspaceFetch("attendance", {
      method: "POST",
      body: JSON.stringify({ studentId, date, status }),
    });
  };

  return (
    <Shell title={config.title} description={config.description}>
      <input
        type="date"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      {students.length === 0 ? (
        <p className="text-sm text-gray-500">No assigned students yet.</p>
      ) : (
        <ul className="space-y-2">
          {students.map((s) => (
            <li
              key={s.studentId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3 shadow-sm"
            >
              <span className="font-medium text-sm">{s.studentName}</span>
              <select
                className="rounded-lg border border-gray-200 px-2 py-1 text-sm"
                value={statusByStudent[s.studentId] ?? "present"}
                onChange={(e) => save(s.studentId, e.target.value)}
              >
                {["present", "absent", "tardy", "excused", "remote"].map((st) => (
                  <option key={st} value={st}>{st}</option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      )}
    </Shell>
  );
}

function GradebookView({ config }: { config: WorkspacePageConfig }) {
  const [assignments, setAssignments] = useState<Array<{ _id: string; title: string; pointsPossible: number }>>([]);
  const [title, setTitle] = useState("");

  const load = () => {
    workspaceFetch<{ assignments: typeof assignments }>("gradebook").then((d) =>
      setAssignments(d.assignments ?? [])
    );
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!title.trim()) return;
    await workspaceFetch("gradebook", { method: "POST", body: JSON.stringify({ title }) });
    setTitle("");
    load();
  };

  const remove = async (id: string) => {
    await workspaceFetch("gradebook", {
      method: "DELETE",
      query: { id, kind: "assignment" },
    });
    load();
  };

  return (
    <Shell title={config.title} description={config.description}>
      <div className="flex gap-2 rounded-2xl bg-white p-4 shadow-sm">
        <input
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder="New assignment title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button
          type="button"
          onClick={add}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
        >
          Add assignment
        </button>
      </div>
      <ul className="space-y-2">
        {assignments.map((a) => (
          <li
            key={a._id}
            className="flex justify-between rounded-xl bg-white px-4 py-3 shadow-sm text-sm"
          >
            <span>
              <strong>{a.title}</strong>
              <span className="ml-2 text-gray-500">{a.pointsPossible} pts</span>
            </span>
            <button type="button" className="text-xs text-red-600" onClick={() => remove(a._id)}>
              Delete
            </button>
          </li>
        ))}
      </ul>
    </Shell>
  );
}

export function WorkspaceModuleView({ pageKey }: { pageKey: string }) {
  const config = useMemo(() => WORKSPACE_PAGE_CONFIG[pageKey], [pageKey]);

  if (!config) {
    return (
      <Shell title="Workspace" description="Unknown module.">
        <p className="text-sm text-gray-500">This page is not configured yet.</p>
      </Shell>
    );
  }

  switch (config.kind) {
    case "placeholder":
      return <PlaceholderView config={config} />;
    case "calendar":
      return <CalendarView config={config} />;
    case "classroom":
      return <ClassroomView config={config} />;
    case "records":
      return <RecordsView config={config} />;
    case "todos":
      return <TodosView config={config} />;
    case "end-of-day":
      return <EndOfDayView config={config} />;
    case "attendance":
      return <AttendanceView config={config} />;
    case "gradebook":
      return <GradebookView config={config} />;
    case "lesson-plans":
      return (
        <SimpleListView
          config={config}
          apiModule="lesson-plans"
          fields={[
            { key: "title", label: "Lesson title", required: true },
            { key: "subject", label: "Subject" },
          ]}
        />
      );
    case "planner":
      return (
        <SimpleListView
          config={config}
          apiModule="planner"
          fields={[
            { key: "title", label: "Block title", required: true },
            { key: "subject", label: "Subject" },
          ]}
        />
      );
    case "standards":
      return (
        <SimpleListView
          config={config}
          apiModule="standards"
          fields={[
            { key: "subject", label: "Subject" },
            { key: "standardCode", label: "Standard code", required: true },
            { key: "standardLabel", label: "Label" },
          ]}
        />
      );
    case "inventory":
      return (
        <SimpleListView
          config={config}
          apiModule="inventory"
          fields={[
            { key: "itemName", label: "Item name", required: true },
            { key: "quantity", label: "Qty" },
          ]}
        />
      );
    case "field-trips":
      return (
        <SimpleListView
          config={config}
          apiModule="field-trips"
          fields={[
            { key: "tripName", label: "Trip name", required: true },
            { key: "destination", label: "Destination" },
          ]}
        />
      );
    case "documents":
      return (
        <SimpleListView
          config={config}
          apiModule="documents"
          fields={[
            { key: "fileName", label: "File name", required: true },
            { key: "filePath", label: "URL or storage path" },
            { key: "description", label: "Description" },
          ]}
        />
      );
    default:
      return <PlaceholderView config={config} />;
  }
}
