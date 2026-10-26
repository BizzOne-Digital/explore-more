"use client";

import { useCallback, useEffect, useState } from "react";
import type { WorkspacePageConfig } from "@/lib/tutor/workspace-pages";

type TodoRow = {
  _id: string;
  title: string;
  description?: string;
  notes?: string;
  dueDate?: string;
  dueTime?: string;
  priority?: string;
  status?: string;
  assignedTo?: string;
};

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

export function TodosWorkspaceView({ config }: { config: WorkspacePageConfig }) {
  const [items, setItems] = useState<TodoRow[]>([]);
  const [filter, setFilter] = useState<"all" | "open" | "completed">("all");
  const [form, setForm] = useState({
    title: "",
    description: "",
    notes: "",
    dueDate: "",
    dueTime: "",
    priority: "normal",
    assignedTo: "",
  });

  const load = useCallback(() => {
    workspaceFetch<{ items: TodoRow[] }>("todos")
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    queueMicrotask(() => load());
  }, [load]);

  const visible = items.filter((t) => {
    if (filter === "open") return t.status !== "completed";
    if (filter === "completed") return t.status === "completed";
    return true;
  });

  const add = async () => {
    if (!form.title.trim()) return;
    await workspaceFetch("todos", { method: "POST", body: JSON.stringify(form) });
    setForm({
      title: "",
      description: "",
      notes: "",
      dueDate: "",
      dueTime: "",
      priority: "normal",
      assignedTo: "",
    });
    load();
  };

  const toggle = async (row: TodoRow) => {
    await workspaceFetch("todos", {
      method: "PATCH",
      body: JSON.stringify({
        id: row._id,
        status: row.status === "completed" ? "open" : "completed",
      }),
    });
    load();
  };

  const remove = async (id: string) => {
    await workspaceFetch("todos", { method: "DELETE", query: { id } });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-explore-charcoal">{config.title}</h2>
        <p className="mt-1 text-sm text-gray-500">{config.description}</p>
      </div>

      <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
        <input
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder="Task title *"
          value={form.title}
          onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
        />
        <textarea
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          rows={2}
          placeholder="Description"
          value={form.description}
          onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
        />
        <textarea
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          rows={2}
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
        />
        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            value={form.dueDate}
            onChange={(e) => setForm((p) => ({ ...p, dueDate: e.target.value }))}
          />
          <input
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="Due time"
            value={form.dueTime}
            onChange={(e) => setForm((p) => ({ ...p, dueTime: e.target.value }))}
          />
          <select
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            value={form.priority}
            onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value }))}
          >
            <option value="normal">Normal</option>
            <option value="important">Important</option>
            <option value="urgent">Urgent</option>
          </select>
          <input
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="Assigned to"
            value={form.assignedTo}
            onChange={(e) => setForm((p) => ({ ...p, assignedTo: e.target.value }))}
          />
        </div>
        <button
          type="button"
          onClick={add}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
        >
          Add task
        </button>
      </div>

      <div className="flex gap-2">
        {(["all", "open", "completed"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1 text-sm capitalize ${
              filter === f ? "bg-violet-600 text-white" : "border border-gray-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <ul className="space-y-3">
        {visible.map((row) => (
          <li key={row._id} className="rounded-xl bg-white p-4 shadow-sm text-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{row.title}</p>
                {row.description && <p className="mt-1 text-gray-600">{row.description}</p>}
                {row.notes && (
                  <p className="mt-2 rounded-lg bg-gray-50 p-2 text-gray-700">
                    <span className="text-xs font-medium text-gray-500">Notes: </span>
                    {row.notes}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  {[
                    row.priority,
                    row.dueDate ? new Date(row.dueDate).toLocaleDateString() : null,
                    row.dueTime,
                    row.assignedTo ? `Assigned: ${row.assignedTo}` : null,
                    row.status,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              </div>
              <div className="flex gap-2 text-xs">
                <button type="button" className="text-violet-700" onClick={() => toggle(row)}>
                  {row.status === "completed" ? "Mark open" : "Complete"}
                </button>
                <button type="button" className="text-red-600" onClick={() => remove(row._id)}>
                  Delete
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
