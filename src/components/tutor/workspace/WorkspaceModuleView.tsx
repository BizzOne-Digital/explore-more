"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  WORKSPACE_PAGE_CONFIG,
  type WorkspacePageConfig,
} from "@/lib/tutor/workspace-pages";
import {
  TeacherPortfoliosOverview,
  TeacherProgressOverview,
  TeacherReportsHub,
} from "@/components/teacher/TeacherStudentHubViews";

type StudentOption = { studentId: string; studentName: string };

async function workspaceFetch<T>(
  apiModule: string,
  init?: RequestInit & { query?: Record<string, string> }
): Promise<T> {
  const q = init?.query
    ? `?${new URLSearchParams(init.query).toString()}`
    : "";
  const res = await fetch(`/api/teacher/workspace/${apiModule}${q}`, {
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

function mondayOfWeek(isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00`);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function addDaysIso(iso: string, days: number) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

type PlannerRow = {
  _id: string;
  title: string;
  subject?: string;
  date: string;
  startTime?: string;
  endTime?: string;
  studentId?: string;
};

function CalendarView({ config }: { config: WorkspacePageConfig }) {
  const today = new Date().toISOString().slice(0, 10);
  const [weekStart, setWeekStart] = useState(() => mondayOfWeek(today));
  const [entries, setEntries] = useState<PlannerRow[]>([]);
  const [roster, setRoster] = useState<StudentOption[]>([]);

  const weekEnd = addDaysIso(weekStart, 6);

  useEffect(() => {
    fetch("/api/teacher/roster")
      .then((r) => r.json())
      .then((json) => {
        const list = (json.students ?? []) as Array<{ studentId: string; studentName: string }>;
        setRoster(list.map((s) => ({ studentId: s.studentId, studentName: s.studentName })));
      })
      .catch(() => setRoster([]));
  }, []);

  useEffect(() => {
    workspaceFetch<{ items: PlannerRow[] }>("planner", {
      query: { from: weekStart, to: weekEnd },
    })
      .then((d) => setEntries(d.items ?? []))
      .catch(() => setEntries([]));
  }, [weekStart, weekEnd]);

  const rosterName = (id: string) =>
    roster.find((s) => s.studentId === id)?.studentName ?? "Student";

  const days = Array.from({ length: 7 }, (_, i) => addDaysIso(weekStart, i));

  return (
    <Shell title={config.title} description={config.description}>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <button
          type="button"
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
          onClick={() => setWeekStart(addDaysIso(weekStart, -7))}
        >
          ← Previous week
        </button>
        <button
          type="button"
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
          onClick={() => setWeekStart(mondayOfWeek(today))}
        >
          This week
        </button>
        <button
          type="button"
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm"
          onClick={() => setWeekStart(addDaysIso(weekStart, 7))}
        >
          Next week →
        </button>
        <span className="text-sm text-gray-600">
          {new Date(`${weekStart}T12:00:00`).toLocaleDateString()} –{" "}
          {new Date(`${weekEnd}T12:00:00`).toLocaleDateString()}
        </span>
      </div>

      <div className="grid gap-3 lg:grid-cols-7">
        {days.map((dayIso) => {
          const dayEntries = entries.filter((e) => String(e.date).slice(0, 10) === dayIso);
          return (
            <div key={dayIso} className="rounded-xl bg-white p-3 shadow-sm min-h-[120px]">
              <p className="text-xs font-semibold text-gray-500">
                {new Date(`${dayIso}T12:00:00`).toLocaleDateString(undefined, {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
              <ul className="mt-2 space-y-2">
                {dayEntries.map((e) => (
                  <li key={e._id} className="rounded-lg bg-violet-50 px-2 py-1.5 text-xs">
                    <span className="font-medium text-explore-charcoal">{e.title}</span>
                    {e.subject ? <span className="text-gray-600"> · {e.subject}</span> : null}
                    {e.startTime ? <span className="block text-gray-500">{e.startTime}</span> : null}
                    {e.studentId ? (
                      <span className="mt-0.5 block text-violet-800">{rosterName(String(e.studentId))}</span>
                    ) : (
                      <span className="mt-0.5 block text-gray-500">Teacher block</span>
                    )}
                  </li>
                ))}
                {dayEntries.length === 0 && (
                  <li className="text-xs text-gray-400">No blocks</li>
                )}
              </ul>
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/teacher/planner"
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          Teacher planner
        </Link>
        <Link
          href="/teacher/student-schedules"
          className="rounded-lg border border-violet-200 px-4 py-2 text-sm font-medium text-violet-700 hover:bg-violet-50"
        >
          Student schedules
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
  const searchParams = useSearchParams();
  const recordType = config.recordType!;
  const [items, setItems] = useState<Array<{ _id: string; title?: string; body: string; eventDate: string }>>([]);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const studentIdFromUrl = searchParams.get("studentId") ?? "";
  const [studentIdOverride, setStudentIdOverride] = useState("");
  const activeStudentId = studentIdFromUrl || studentIdOverride;
  const [roster, setRoster] = useState<StudentOption[]>([]);

  useEffect(() => {
    fetch("/api/teacher/roster")
      .then((r) => r.json())
      .then((json) => {
        const list = (json.students ?? []) as Array<{ studentId: string; studentName: string }>;
        setRoster(list.map((s) => ({ studentId: s.studentId, studentName: s.studentName })));
      })
      .catch(() => setRoster([]));
  }, []);

  const load = useCallback(() => {
    const query: Record<string, string> = { recordType };
    if (activeStudentId) query.studentId = activeStudentId;
    workspaceFetch<{ items: typeof items }>("records", { query })
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, [recordType, activeStudentId]);

  useEffect(() => {
    queueMicrotask(() => load());
  }, [load]);

  const add = async () => {
    if (!body.trim()) return;
    await workspaceFetch("records", {
      method: "POST",
      body: JSON.stringify({
        recordType,
        title,
        body,
        studentId: activeStudentId || undefined,
      }),
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
        {roster.length > 0 && (
          <select
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            value={activeStudentId}
            onChange={(e) => setStudentIdOverride(e.target.value)}
            disabled={!!studentIdFromUrl}
          >
            <option value="">Select student (optional)</option>
            {roster.map((s) => (
              <option key={s.studentId} value={s.studentId}>{s.studentName}</option>
            ))}
          </select>
        )}
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

function DocumentsListView({
  config,
  pageKey,
}: {
  config: WorkspacePageConfig;
  pageKey: string;
}) {
  let listQuery: Record<string, string> | undefined;
  if (pageKey === "files") listQuery = { all: "1" };
  else if (config.documentFolder) listQuery = { folder: config.documentFolder };
  return (
    <SimpleListView
      config={config}
      apiModule="documents"
      listQuery={listQuery}
      fields={[
        { key: "fileName", label: "File name", required: true },
        { key: "filePath", label: "URL or storage path" },
        { key: "description", label: "Description" },
      ]}
      formatLabel={(item) =>
        `${item.fileName ?? "File"}${item.folder ? ` · ${item.folder}` : ""}`
      }
    />
  );
}

function SimpleListView({
  config,
  apiModule,
  fields,
  formatLabel,
  listQuery,
}: {
  config: WorkspacePageConfig;
  apiModule: string;
  fields: { key: string; label: string; required?: boolean }[];
  formatLabel?: (item: Record<string, unknown>) => string;
  listQuery?: Record<string, string>;
}) {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [form, setForm] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    const query: Record<string, string> = { ...(listQuery ?? {}) };
    if (!query.all && config.documentFolder) query.folder = config.documentFolder;
    workspaceFetch<{ items: typeof items }>(apiModule, { query })
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, [apiModule, config.documentFolder, listQuery]);

  useEffect(() => {
    queueMicrotask(() => load());
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

  const labelFor = (item: Record<string, unknown>) => {
    if (formatLabel) return formatLabel(item);
    if (item.standardCode) {
      const label = item.standardLabel ? String(item.standardLabel) : "";
      return label
        ? `${item.standardCode} — ${label}`
        : String(item.standardCode);
    }
    return String(
      item.title ?? item.tripName ?? item.itemName ?? item.fileName ?? item.standardCode ?? "Item"
    );
  };

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

function useListDrafts(
  items: Array<Record<string, unknown>>,
  keys: string[],
  formatValue?: (key: string, value: unknown) => string
) {
  const [drafts, setDrafts] = useState<Record<string, Record<string, string>>>({});

  useEffect(() => {
    queueMicrotask(() => {
      const next: Record<string, Record<string, string>> = {};
      for (const item of items) {
        const id = String(item._id);
        const row: Record<string, string> = {};
        for (const key of keys) {
          const raw = item[key];
          row[key] = formatValue ? formatValue(key, raw) : raw != null ? String(raw) : "";
        }
        next[id] = row;
      }
      setDrafts(next);
    });
  }, [items, keys, formatValue]);

  return [drafts, setDrafts] as const;
}

function InventoryView({ config }: { config: WorkspacePageConfig }) {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [addForm, setAddForm] = useState({ itemName: "", quantity: "1" });

  const load = useCallback(() => {
    workspaceFetch<{ items: typeof items }>("inventory")
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const [drafts, setDrafts] = useListDrafts(items, ["itemName", "quantity"], (key, value) =>
    key === "quantity" ? String(value ?? 1) : String(value ?? "")
  );

  const add = async () => {
    if (!addForm.itemName.trim()) return;
    await workspaceFetch("inventory", {
      method: "POST",
      body: JSON.stringify({
        itemName: addForm.itemName.trim(),
        quantity: Math.max(0, Number(addForm.quantity) || 1),
      }),
    });
    setAddForm({ itemName: "", quantity: "1" });
    load();
  };

  const save = async (id: string) => {
    const row = drafts[id];
    if (!row) return;
    await workspaceFetch("inventory", {
      method: "PATCH",
      body: JSON.stringify({
        id,
        itemName: row.itemName.trim(),
        quantity: Math.max(0, Number(row.quantity) || 0),
      }),
    });
    load();
  };

  const remove = async (id: string) => {
    await workspaceFetch("inventory", { method: "DELETE", query: { id } });
    load();
  };

  return (
    <Shell title={config.title} description={config.description}>
      <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-4 shadow-sm">
        <input
          className="min-w-[140px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder="Item name"
          value={addForm.itemName}
          onChange={(e) => setAddForm((p) => ({ ...p, itemName: e.target.value }))}
        />
        <input
          type="number"
          min={0}
          className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder="Qty"
          value={addForm.quantity}
          onChange={(e) => setAddForm((p) => ({ ...p, quantity: e.target.value }))}
        />
        <button
          type="button"
          onClick={add}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
        >
          Add
        </button>
      </div>
      <ul className="space-y-2">
        {items.map((item) => {
          const id = String(item._id);
          const row = drafts[id] ?? { itemName: "", quantity: "1" };
          return (
            <li
              key={id}
              className="flex flex-wrap items-center gap-2 rounded-xl bg-white px-4 py-3 shadow-sm"
            >
              <input
                className="min-w-[120px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={row.itemName}
                onChange={(e) =>
                  setDrafts((p) => ({ ...p, [id]: { ...row, itemName: e.target.value } }))
                }
              />
              <label className="flex items-center gap-1.5 text-sm text-gray-600">
                <span className="shrink-0 font-medium">Qty</span>
                <input
                  type="number"
                  min={0}
                  className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm"
                  value={row.quantity}
                  onChange={(e) =>
                    setDrafts((p) => ({ ...p, [id]: { ...row, quantity: e.target.value } }))
                  }
                />
              </label>
              <button
                type="button"
                onClick={() => save(id)}
                className="rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-50"
              >
                Save
              </button>
              <button
                type="button"
                className="text-xs text-red-600"
                onClick={() => remove(id)}
              >
                Delete
              </button>
            </li>
          );
        })}
      </ul>
    </Shell>
  );
}

function FieldTripsView({ config }: { config: WorkspacePageConfig }) {
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [roster, setRoster] = useState<StudentOption[]>([]);
  const [rosterByTrip, setRosterByTrip] = useState<Record<string, string[]>>({});
  const [addForm, setAddForm] = useState({
    tripName: "",
    tripDate: "",
    tripTime: "",
    destination: "",
  });

  const syncRosterFromItems = (list: Array<Record<string, unknown>>) => {
    const next: Record<string, string[]> = {};
    for (const item of list) {
      const id = String(item._id);
      const ids = Array.isArray(item.rosterStudentIds)
        ? (item.rosterStudentIds as unknown[]).map((x) => String(x))
        : [];
      next[id] = ids;
    }
    setRosterByTrip(next);
  };

  const load = useCallback(() => {
    workspaceFetch<{ items: typeof items }>("field-trips")
      .then((d) => {
        const list = d.items ?? [];
        setItems(list);
        syncRosterFromItems(list);
      })
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    queueMicrotask(() => load());
    fetch("/api/teacher/roster")
      .then((r) => r.json())
      .then((json) => {
        const list = (json.students ?? []) as Array<{ studentId: string; studentName: string }>;
        setRoster(list.map((s) => ({ studentId: s.studentId, studentName: s.studentName })));
      });
  }, [load]);

  const formatTripField = (key: string, value: unknown) => {
    if (key === "tripDate" && value) {
      const d = new Date(String(value));
      if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
    return value != null ? String(value) : "";
  };

  const [drafts, setDrafts] = useListDrafts(
    items,
    ["tripName", "tripDate", "tripTime", "destination"],
    formatTripField
  );

  const add = async () => {
    if (!addForm.tripName.trim()) return;
    await workspaceFetch("field-trips", {
      method: "POST",
      body: JSON.stringify({
        tripName: addForm.tripName.trim(),
        tripDate: addForm.tripDate || undefined,
        tripTime: addForm.tripTime.trim() || undefined,
        destination: addForm.destination.trim() || undefined,
      }),
    });
    setAddForm({ tripName: "", tripDate: "", tripTime: "", destination: "" });
    load();
  };

  const save = async (id: string) => {
    const row = drafts[id];
    if (!row) return;
    await workspaceFetch("field-trips", {
      method: "PATCH",
      body: JSON.stringify({
        id,
        tripName: row.tripName.trim(),
        tripDate: row.tripDate || undefined,
        tripTime: row.tripTime.trim() || undefined,
        destination: row.destination.trim() || undefined,
      }),
    });
    load();
  };

  const remove = async (id: string) => {
    await workspaceFetch("field-trips", { method: "DELETE", query: { id } });
    load();
  };

  const toggleTripStudent = (tripId: string, studentId: string) => {
    setRosterByTrip((prev) => {
      const set = new Set(prev[tripId] ?? []);
      if (set.has(studentId)) set.delete(studentId);
      else set.add(studentId);
      return { ...prev, [tripId]: [...set] };
    });
  };

  const saveTripRoster = async (tripId: string) => {
    await workspaceFetch("field-trips", {
      method: "PATCH",
      body: JSON.stringify({
        id: tripId,
        rosterStudentIds: rosterByTrip[tripId] ?? [],
      }),
    });
    load();
  };

  const emptyTripRow = { tripName: "", tripDate: "", tripTime: "", destination: "" };

  const fieldRow = (
    id: string | "new",
    row: Record<string, string>,
    onChange: (key: keyof typeof addForm, value: string) => void,
    showActions?: boolean
  ) => (
    <div className="flex flex-wrap gap-2">
      <input
        className="min-w-[120px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
        placeholder="Trip name"
        value={row.tripName}
        onChange={(e) => onChange("tripName", e.target.value)}
      />
      <input
        type="date"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        value={row.tripDate}
        onChange={(e) => onChange("tripDate", e.target.value)}
        aria-label="Date"
      />
      <input
        type="time"
        className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        value={row.tripTime}
        onChange={(e) => onChange("tripTime", e.target.value)}
        aria-label="Time"
      />
      <input
        className="min-w-[160px] flex-[2] rounded-lg border border-gray-200 px-3 py-2 text-sm"
        placeholder="Address / location"
        value={row.destination}
        onChange={(e) => onChange("destination", e.target.value)}
      />
      {showActions && id !== "new" && (
        <>
          <button
            type="button"
            onClick={() => save(id)}
            className="rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-50"
          >
            Save
          </button>
          <button
            type="button"
            className="text-xs text-red-600"
            onClick={() => remove(id)}
          >
            Delete
          </button>
        </>
      )}
    </div>
  );

  return (
    <Shell title={config.title} description={config.description}>
      <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        {fieldRow("new", addForm, (key, value) => setAddForm((p) => ({ ...p, [key]: value })))}
        <button
          type="button"
          onClick={add}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
        >
          Add trip
        </button>
      </div>
      <ul className="space-y-3">
        {items.map((item) => {
          const id = String(item._id);
          const row = { ...emptyTripRow, ...drafts[id] };
          return (
            <li key={id} className="rounded-xl bg-white px-4 py-3 shadow-sm space-y-3">
              {fieldRow(
                id,
                row,
                (key, value) =>
                  setDrafts((p) => ({ ...p, [id]: { ...row, [key]: value } })),
                true
              )}
              {roster.length > 0 && (
                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs font-medium text-gray-600">Trip roster</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {roster.map((s) => {
                      const selected = (rosterByTrip[id] ?? []).includes(s.studentId);
                      return (
                        <label
                          key={s.studentId}
                          className="flex items-center gap-1.5 rounded-lg border border-gray-100 px-2 py-1 text-xs"
                        >
                          <input
                            type="checkbox"
                            checked={selected}
                            onChange={() => toggleTripStudent(id, s.studentId)}
                          />
                          {s.studentName}
                        </label>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    onClick={() => saveTripRoster(id)}
                    className="mt-2 rounded-lg border border-violet-200 px-3 py-1 text-xs font-medium text-violet-700"
                  >
                    Save roster
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Shell>
  );
}

function SubstituteView({ config }: { config: WorkspacePageConfig }) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [classroom, setClassroom] = useState<Record<string, unknown> | null>(null);
  const [lessons, setLessons] = useState<Array<Record<string, unknown>>>([]);
  const [planner, setPlanner] = useState<PlannerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const day = date;
    queueMicrotask(() => setLoading(true));
    Promise.all([
      workspaceFetch<{ item: Record<string, unknown> | null }>("classroom"),
      workspaceFetch<{ items: Array<Record<string, unknown>> }>("lesson-plans"),
      workspaceFetch<{ items: PlannerRow[] }>("planner", { query: { from: day, to: day } }),
    ])
      .then(([room, plans, plan]) => {
        setClassroom(room.item);
        const planItems = plans.items ?? [];
        setLessons(
          planItems.filter((p) => String(p.date ?? "").slice(0, 10) === day)
        );
        setPlanner(plan.items ?? []);
      })
      .catch(() => {
        setClassroom(null);
        setLessons([]);
        setPlanner([]);
      })
      .finally(() => setLoading(false));
  }, [date]);

  const room = classroom ?? {};

  return (
    <Shell title={config.title} description={config.description}>
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <label className="text-sm">
          <span className="font-medium text-gray-700">Sub date</span>
          <input
            type="date"
            className="mt-1 block rounded-lg border border-gray-200 px-3 py-2 text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <Link
          href="/teacher/classroom"
          className="text-sm text-violet-700 hover:underline"
        >
          Edit classroom profile
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading sub packet…</p>
      ) : (
        <div className="space-y-4">
          <section className="rounded-2xl bg-white p-5 shadow-sm text-sm">
            <h3 className="font-semibold text-explore-charcoal">Class overview</h3>
            <p className="mt-2 text-gray-700">
              {[room.className, room.grade, room.room].filter(Boolean).join(" · ") || "No classroom profile yet."}
            </p>
            {room.dailyRoutine ? (
              <p className="mt-2"><strong>Routine:</strong> {String(room.dailyRoutine)}</p>
            ) : null}
            {room.emergencyProcedures ? (
              <p className="mt-2"><strong>Emergency:</strong> {String(room.emergencyProcedures)}</p>
            ) : null}
            {room.notes ? (
              <p className="mt-2"><strong>Notes for substitutes:</strong> {String(room.notes)}</p>
            ) : null}
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm text-sm">
            <h3 className="font-semibold text-explore-charcoal">Planner blocks ({date})</h3>
            {planner.length === 0 ? (
              <p className="mt-2 text-gray-500">No planner blocks this day.</p>
            ) : (
              <ul className="mt-2 list-disc space-y-1 pl-5">
                {planner.map((b) => (
                  <li key={b._id}>
                    {b.startTime ? `${b.startTime} — ` : ""}
                    {b.title}
                    {b.subject ? ` (${b.subject})` : ""}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl bg-white p-5 shadow-sm text-sm">
            <h3 className="font-semibold text-explore-charcoal">Lesson plans ({date})</h3>
            {lessons.length === 0 ? (
              <p className="mt-2 text-gray-500">No lesson plans dated this day.</p>
            ) : (
              <ul className="mt-2 space-y-3">
                {lessons.map((l) => (
                  <li key={String(l._id)} className="rounded-lg bg-gray-50 p-3">
                    <p className="font-medium">{String(l.title)}</p>
                    {l.subject ? <p className="text-gray-600">Subject: {String(l.subject)}</p> : null}
                    {l.instruction ? (
                      <p className="mt-1 text-gray-700 whitespace-pre-wrap">{String(l.instruction)}</p>
                    ) : null}
                    {l.materials ? (
                      <p className="mt-1 text-gray-600"><strong>Materials:</strong> {String(l.materials)}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            <Link href="/teacher/lesson-plans" className="mt-3 inline-block text-violet-700 hover:underline">
              All lesson plans
            </Link>
          </section>
        </div>
      )}
    </Shell>
  );
}

function HelpView({ config }: { config: WorkspacePageConfig }) {
  return (
    <Shell title={config.title} description={config.description}>
      <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm text-sm text-gray-700">
        <section>
          <h3 className="font-semibold text-explore-charcoal">Sign in</h3>
          <p className="mt-1">
            School teachers use the Staff Portal at{" "}
            <Link href="/tutor/login" className="text-violet-700 hover:underline">
              /tutor/login
            </Link>{" "}
            with a <strong>Teacher (School)</strong> account.
          </p>
        </section>
        <section>
          <h3 className="font-semibold text-explore-charcoal">Class roster</h3>
          <p className="mt-1">
            Attendance, assessments, and My Students use your administrator-assigned class roster.
            Students are added in Admin → Users → your teacher profile → Class roster.
          </p>
        </section>
        <section>
          <h3 className="font-semibold text-explore-charcoal">Quick links</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li><Link href="/teacher/planner" className="text-violet-700 hover:underline">Teacher Planner</Link></li>
            <li><Link href="/teacher/lesson-plans" className="text-violet-700 hover:underline">Lesson Plans</Link></li>
            <li><Link href="/teacher/students" className="text-violet-700 hover:underline">My Students</Link></li>
            <li><Link href="/teacher/feedback" className="text-violet-700 hover:underline">Send feedback</Link></li>
          </ul>
        </section>
        <section>
          <h3 className="font-semibold text-explore-charcoal">Need help?</h3>
          <p className="mt-1">
            Contact Explore More Academy via{" "}
            <Link href="/contact" className="text-violet-700 hover:underline">Contact Us</Link> or
            colleague messages in the portal.
          </p>
        </section>
      </div>
    </Shell>
  );
}

function AssessmentsView({ config }: { config: WorkspacePageConfig }) {
  const searchParams = useSearchParams();
  const [items, setItems] = useState<Array<Record<string, unknown>>>([]);
  const [roster, setRoster] = useState<StudentOption[]>([]);
  const [form, setForm] = useState({
    studentId: searchParams.get("studentId") ?? "",
    title: "",
    subject: "",
    assessmentType: "",
    eventDate: new Date().toISOString().slice(0, 10),
    score: "",
    maxScore: "100",
    notes: "",
  });

  const filterStudentId = searchParams.get("studentId") ?? "";

  const load = useCallback(() => {
    const query: Record<string, string> = {};
    if (filterStudentId) query.studentId = filterStudentId;
    workspaceFetch<{ items: typeof items }>("assessments", { query })
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, [filterStudentId]);

  const effectiveStudentId = filterStudentId || form.studentId;

  useEffect(() => {
    queueMicrotask(() => load());
    fetch("/api/teacher/roster")
      .then((r) => r.json())
      .then((json) => {
        const list = (json.students ?? []) as Array<{ studentId: string; studentName: string }>;
        setRoster(list.map((s) => ({ studentId: s.studentId, studentName: s.studentName })));
      });
  }, [load]);

  const rosterName = (id: string) =>
    roster.find((s) => s.studentId === id)?.studentName ?? "Student";

  const add = async () => {
    if (!effectiveStudentId || !form.title.trim()) return;
    await workspaceFetch("assessments", {
      method: "POST",
      body: JSON.stringify({
        studentId: effectiveStudentId,
        title: form.title.trim(),
        subject: form.subject.trim() || undefined,
        assessmentType: form.assessmentType.trim() || undefined,
        eventDate: form.eventDate,
        score: form.score ? Number(form.score) : undefined,
        maxScore: Number(form.maxScore) || 100,
        notes: form.notes.trim() || undefined,
      }),
    });
    setForm((p) => ({ ...p, title: "", score: "", notes: "" }));
    load();
  };

  const remove = async (id: string) => {
    await workspaceFetch("assessments", { method: "DELETE", query: { id } });
    load();
  };

  const pct = (item: Record<string, unknown>) => {
    const score = Number(item.score);
    const max = Number(item.maxScore) || 100;
    if (!Number.isFinite(score) || max <= 0) return "";
    return `${Math.round((score / max) * 100)}%`;
  };

  return (
    <Shell title={config.title} description={config.description}>
      <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-4 shadow-sm">
        <select
          className="min-w-[140px] rounded-lg border border-gray-200 px-3 py-2 text-sm"
          value={effectiveStudentId}
          onChange={(e) => setForm((p) => ({ ...p, studentId: e.target.value }))}
          disabled={!!filterStudentId}
        >
          <option value="">Student</option>
          {roster.map((s) => (
            <option key={s.studentId} value={s.studentId}>{s.studentName}</option>
          ))}
        </select>
        <input
          className="min-w-[120px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder="Assessment title"
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
          value={form.eventDate}
          onChange={(e) => setForm((p) => ({ ...p, eventDate: e.target.value }))}
        />
        <input
          className="w-20 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder="Score"
          value={form.score}
          onChange={(e) => setForm((p) => ({ ...p, score: e.target.value }))}
        />
        <input
          className="w-20 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder="Max"
          value={form.maxScore}
          onChange={(e) => setForm((p) => ({ ...p, maxScore: e.target.value }))}
        />
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
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3 shadow-sm text-sm"
          >
            <span>
              <strong>{String(item.title)}</strong>
              <span className="ml-2 text-gray-500">
                {rosterName(String(item.studentId))}
                {item.subject ? ` · ${item.subject}` : ""}
                {item.score != null
                  ? ` · ${item.score}/${item.maxScore ?? 100}${pct(item) ? ` (${pct(item)})` : ""}`
                  : ""}
                {item.eventDate
                  ? ` · ${new Date(String(item.eventDate)).toLocaleDateString()}`
                  : ""}
              </span>
            </span>
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
        { key: "dueDate", label: "Due date (YYYY-MM-DD)" },
        { key: "dueTime", label: "Due time (e.g. 2:30 PM)" },
      ]}
      formatLabel={(item) => {
        const title = String(item.title ?? "Task");
        const due = item.dueDate
          ? new Date(String(item.dueDate)).toLocaleDateString()
          : "";
        const time = item.dueTime ? String(item.dueTime) : "";
        const suffix = [due, time].filter(Boolean).join(" · ");
        return suffix ? `${title} — ${suffix}` : title;
      }}
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
  const [rosterLoading, setRosterLoading] = useState(true);
  const [statusByStudent, setStatusByStudent] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch("/api/teacher/roster")
      .then((r) => r.json())
      .then((json) => {
        const list = (json.students ?? []) as Array<{ studentId: string; studentName: string }>;
        setStudents(
          list.map((s) => ({ studentId: s.studentId, studentName: s.studentName }))
        );
      })
      .finally(() => setRosterLoading(false));
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
      {rosterLoading ? (
        <p className="text-sm text-gray-500">Loading class roster…</p>
      ) : students.length === 0 ? (
        <p className="text-sm text-gray-500">
          No students on your class roster yet. Ask your administrator to add students under Admin →
          Users → your teacher account → Class roster, or use Teacher Notes until then.
        </p>
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
  const searchParams = useSearchParams();
  const highlightStudentId = searchParams.get("studentId") ?? "";
  const [assignments, setAssignments] = useState<
    Array<{ _id: string; title: string; pointsPossible: number }>
  >([]);
  const [scores, setScores] = useState<
    Array<{ _id?: string; assignmentId: string; studentId: string; score?: number }>
  >([]);
  const [roster, setRoster] = useState<StudentOption[]>([]);
  const [title, setTitle] = useState("");
  const [pointsPossible, setPointsPossible] = useState("100");
  const [selectedId, setSelectedId] = useState("");
  const [pointsDraft, setPointsDraft] = useState<Record<string, string>>({});
  const [scoreDraft, setScoreDraft] = useState<Record<string, string>>({});

  const load = useCallback(() => {
    workspaceFetch<{ assignments: typeof assignments; scores: typeof scores }>("gradebook").then(
      (d) => {
        setAssignments(d.assignments ?? []);
        setScores(d.scores ?? []);
        setSelectedId((prev) =>
          prev || (d.assignments?.[0]?._id ? String(d.assignments[0]._id) : "")
        );
      }
    );
  }, []);

  useEffect(() => {
    queueMicrotask(() => load());
    fetch("/api/teacher/roster")
      .then((r) => r.json())
      .then((json) => {
        const list = (json.students ?? []) as Array<{ studentId: string; studentName: string }>;
        setRoster(list.map((s) => ({ studentId: s.studentId, studentName: s.studentName })));
      });
  }, [load]);

  const selected = assignments.find((a) => a._id === selectedId);
  const maxPts = selected?.pointsPossible ?? 100;

  const scoreFor = (studentId: string) =>
    scores.find(
      (s) => String(s.assignmentId) === selectedId && String(s.studentId) === studentId
    );

  const add = async () => {
    if (!title.trim()) return;
    await workspaceFetch("gradebook", {
      method: "POST",
      body: JSON.stringify({
        title: title.trim(),
        pointsPossible: Number(pointsPossible) || 100,
      }),
    });
    setTitle("");
    load();
  };

  const saveAssignmentPoints = async (assignmentId: string) => {
    const raw = pointsDraft[assignmentId] ?? String(assignments.find((a) => a._id === assignmentId)?.pointsPossible ?? 100);
    await workspaceFetch("gradebook", {
      method: "PATCH",
      body: JSON.stringify({
        id: assignmentId,
        kind: "assignment",
        pointsPossible: Number(raw) || 0,
      }),
    });
    load();
  };

  const saveScore = async (studentId: string) => {
    if (!selectedId) return;
    const raw = scoreDraft[studentId] ?? "";
    const score = raw === "" ? undefined : Number(raw);
    await workspaceFetch("gradebook", {
      method: "POST",
      body: JSON.stringify({
        kind: "score",
        assignmentId: selectedId,
        studentId,
        score,
        status: score == null || Number.isNaN(score) ? "missing" : "graded",
      }),
    });
    load();
  };

  const remove = async (id: string) => {
    await workspaceFetch("gradebook", {
      method: "DELETE",
      query: { id, kind: "assignment" },
    });
    if (selectedId === id) setSelectedId("");
    load();
  };

  return (
    <Shell title={config.title} description={config.description}>
      <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-4 shadow-sm">
        <input
          className="min-w-[140px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder="New assignment title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <input
          className="w-24 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder="Max pts"
          value={pointsPossible}
          onChange={(e) => setPointsPossible(e.target.value)}
        />
        <button
          type="button"
          onClick={add}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
        >
          Add assignment
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ul className="space-y-2">
          {assignments.map((a) => (
            <li
              key={a._id}
              className={`rounded-xl bg-white px-4 py-3 shadow-sm text-sm ${
                selectedId === a._id ? "ring-2 ring-violet-300" : ""
              }`}
            >
              <button
                type="button"
                className="text-left font-medium text-explore-charcoal"
                onClick={() => setSelectedId(a._id)}
              >
                {a.title}
              </button>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  className="w-20 rounded border border-gray-200 px-2 py-1 text-xs"
                  value={pointsDraft[a._id] ?? String(a.pointsPossible)}
                  onChange={(e) =>
                    setPointsDraft((p) => ({ ...p, [a._id]: e.target.value }))
                  }
                />
                <span className="text-xs text-gray-500">max points</span>
                <button
                  type="button"
                  className="text-xs text-violet-700"
                  onClick={() => saveAssignmentPoints(a._id)}
                >
                  Save max
                </button>
                <button
                  type="button"
                  className="ml-auto text-xs text-red-600"
                  onClick={() => remove(a._id)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>

        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-explore-charcoal">
            {selected ? `Scores — ${selected.title}` : "Select an assignment"}
          </h3>
          <p className="text-xs text-gray-500">Graded out of {maxPts} points</p>
          {roster.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">Add students to your class roster to enter scores.</p>
          ) : !selectedId ? (
            <p className="mt-3 text-sm text-gray-500">Create or select an assignment.</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {roster.map((s) => {
                const existing = scoreFor(s.studentId);
                const val =
                  scoreDraft[s.studentId] ??
                  (existing?.score != null ? String(existing.score) : "");
                const highlighted = highlightStudentId === s.studentId;
                return (
                  <li
                    key={s.studentId}
                    className={`flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 ${
                      highlighted ? "bg-violet-50" : ""
                    }`}
                  >
                    <span className="text-sm">{s.studentName}</span>
                    <div className="flex items-center gap-1">
                      <input
                        className="w-16 rounded border border-gray-200 px-2 py-1 text-sm"
                        placeholder="—"
                        value={val}
                        onChange={(e) =>
                          setScoreDraft((p) => ({ ...p, [s.studentId]: e.target.value }))
                        }
                        onBlur={() => saveScore(s.studentId)}
                      />
                      <span className="text-xs text-gray-400">/ {maxPts}</span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
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
    case "student-progress":
      return pageKey === "portfolios" ? (
        <TeacherPortfoliosOverview />
      ) : (
        <TeacherProgressOverview />
      );
    case "reports-hub":
      return <TeacherReportsHub />;
    case "placeholder":
      return <PlaceholderView config={config} />;
    case "substitute":
      return <SubstituteView config={config} />;
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
            { key: "grade", label: "Grade" },
          ]}
          formatLabel={(item) => {
            const title = String(item.title ?? "Lesson");
            const subject = item.subject ? String(item.subject) : "";
            const grade = item.grade ? ` · Gr ${item.grade}` : "";
            const date = item.date
              ? ` · ${new Date(String(item.date)).toLocaleDateString()}`
              : "";
            return subject ? `${title} — ${subject}${grade}${date}` : `${title}${grade}${date}`;
          }}
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
            { key: "date", label: "Date (YYYY-MM-DD)" },
            { key: "startTime", label: "Start time" },
            { key: "endTime", label: "End time" },
          ]}
          formatLabel={(item) => {
            const title = String(item.title ?? "Block");
            const subject = item.subject ? String(item.subject) : "";
            const date = item.date
              ? ` · ${new Date(String(item.date)).toLocaleDateString()}`
              : "";
            return subject ? `${subject} — ${title}${date}` : `${title}${date}`;
          }}
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
            { key: "standardLabel", label: "Description / label", required: true },
          ]}
        />
      );
    case "assessments":
      return <AssessmentsView config={config} />;
    case "help":
      return <HelpView config={config} />;
    case "inventory":
      return <InventoryView config={config} />;
    case "field-trips":
      return <FieldTripsView config={config} />;
    case "documents":
      return (
        <DocumentsListView config={config} pageKey={pageKey} />
      );
    default:
      return <PlaceholderView config={config} />;
  }
}
