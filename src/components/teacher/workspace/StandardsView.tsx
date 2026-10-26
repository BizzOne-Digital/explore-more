"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { WorkspacePageConfig } from "@/lib/tutor/workspace-pages";

type StandardRow = {
  _id: string;
  subject?: string;
  standardCode?: string;
  standardLabel?: string;
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

export function StandardsView({ config }: { config: WorkspacePageConfig }) {
  const [items, setItems] = useState<StandardRow[]>([]);
  const [q, setQ] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState({ subject: "", standardCode: "", standardLabel: "" });

  const load = useCallback(() => {
    workspaceFetch<{ items: StandardRow[] }>("standards")
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    queueMicrotask(() => load());
  }, [load]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((row) => {
      if (subjectFilter && (row.subject ?? "").toLowerCase() !== subjectFilter.toLowerCase()) {
        return false;
      }
      if (!term) return true;
      return (
        (row.standardCode ?? "").toLowerCase().includes(term) ||
        (row.standardLabel ?? "").toLowerCase().includes(term) ||
        (row.subject ?? "").toLowerCase().includes(term)
      );
    });
  }, [items, q, subjectFilter]);

  const subjects = useMemo(
    () => [...new Set(items.map((i) => i.subject).filter(Boolean))] as string[],
    [items]
  );

  const selected = filtered.find((r) => r._id === selectedId) ?? items.find((r) => r._id === selectedId);

  const add = async () => {
    if (!form.standardCode.trim() || !form.standardLabel.trim()) return;
    await workspaceFetch("standards", { method: "POST", body: JSON.stringify(form) });
    setForm({ subject: "", standardCode: "", standardLabel: "" });
    load();
  };

  const save = async () => {
    if (!selectedId) return;
    await workspaceFetch("standards", {
      method: "PATCH",
      body: JSON.stringify({ id: selectedId, ...form }),
    });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this standard?")) return;
    await workspaceFetch("standards", { method: "DELETE", query: { id } });
    if (selectedId === id) setSelectedId(null);
    load();
  };

  useEffect(() => {
    if (!selected) return;
    queueMicrotask(() => {
      setForm({
        subject: selected.subject ?? "",
        standardCode: selected.standardCode ?? "",
        standardLabel: selected.standardLabel ?? "",
      });
    });
  }, [selected]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-explore-charcoal">{config.title}</h2>
        <p className="mt-1 text-sm text-gray-500">{config.description}</p>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl bg-white p-4 shadow-sm">
        <input
          className="min-w-[160px] flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm"
          placeholder="Search code or description"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          value={subjectFilter}
          onChange={(e) => setSubjectFilter(e.target.value)}
        >
          <option value="">All subjects</option>
          {subjects.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2">Subject</th>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr
                  key={row._id}
                  className={`cursor-pointer border-t border-gray-50 hover:bg-violet-50 ${
                    selectedId === row._id ? "bg-violet-50" : ""
                  }`}
                  onClick={() => setSelectedId(row._id)}
                >
                  <td className="px-3 py-2">{row.subject || "—"}</td>
                  <td className="px-3 py-2 font-mono text-xs">{row.standardCode}</td>
                  <td className="px-3 py-2">{row.standardLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <p className="p-4 text-center text-sm text-gray-500">No standards match.</p>
          )}
        </div>

        <div className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
          <h3 className="font-semibold text-explore-charcoal">
            {selectedId ? "Edit standard" : "Add standard"}
          </h3>
          <input
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="Subject"
            value={form.subject}
            onChange={(e) => setForm((p) => ({ ...p, subject: e.target.value }))}
          />
          <input
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            placeholder="Standard code"
            value={form.standardCode}
            onChange={(e) => setForm((p) => ({ ...p, standardCode: e.target.value }))}
          />
          <textarea
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            rows={4}
            placeholder="Description / label"
            value={form.standardLabel}
            onChange={(e) => setForm((p) => ({ ...p, standardLabel: e.target.value }))}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={selectedId ? save : add}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
            >
              {selectedId ? "Save" : "Add"}
            </button>
            {selectedId && (
              <button
                type="button"
                onClick={() => remove(selectedId)}
                className="rounded-lg border border-red-200 px-4 py-2 text-sm text-red-600"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
