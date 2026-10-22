"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export function TeacherTemplatesClient() {
  const router = useRouter();
  const [items, setItems] = useState<Array<{ _id: string; title: string; subject?: string }>>([]);

  const load = useCallback(() => {
    fetch("/api/teacher/workspace/lesson-plans?view=templates")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
  }, []);

  useEffect(() => {
    queueMicrotask(() => load());
  }, [load]);

  const applyTemplate = async (id: string) => {
    const res = await fetch(`/api/teacher/lesson-plans/${id}/duplicate`, { method: "POST" });
    const json = await res.json();
    if (json.item?._id) router.push(`/teacher/lesson-plans/${json.item._id}`);
  };

  return (
    <ul className="space-y-2">
      {items.map((t) => (
        <li
          key={t._id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white px-4 py-3 shadow-sm"
        >
          <span className="font-medium">{t.title}{t.subject ? ` — ${t.subject}` : ""}</span>
          <button
            type="button"
            onClick={() => applyTemplate(t._id)}
            className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white"
          >
            Use template
          </button>
        </li>
      ))}
      {items.length === 0 && (
        <p className="text-sm text-gray-500">
          Save any lesson plan as a template from the editor to reuse it here.
        </p>
      )}
    </ul>
  );
}

export function TeacherArchiveClient() {
  const [items, setItems] = useState<Array<{ _id: string; title: string }>>([]);

  const load = useCallback(() => {
    fetch("/api/teacher/workspace/lesson-plans?view=archive")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []));
  }, []);

  useEffect(() => {
    queueMicrotask(() => load());
  }, [load]);

  const restore = async (id: string) => {
    await fetch("/api/teacher/workspace/lesson-plans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, archived: false }),
    });
    load();
  };

  return (
    <ul className="space-y-2">
      {items.map((p) => (
        <li
          key={p._id}
          className="flex justify-between rounded-xl bg-white px-4 py-3 shadow-sm text-sm"
        >
          <span>{p.title}</span>
          <button type="button" className="text-violet-700" onClick={() => restore(p._id)}>
            Restore
          </button>
        </li>
      ))}
      {items.length === 0 && <p className="text-sm text-gray-500">No archived lesson plans.</p>}
    </ul>
  );
}

export function TeacherImportExportClient() {
  const [status, setStatus] = useState<string | null>(null);

  const exportJson = async () => {
    const res = await fetch("/api/teacher/lesson-plans/export");
    const data = await res.json();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ema-lesson-plans-${data.schoolYear ?? "export"}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = async (file: File) => {
    setStatus(null);
    const text = await file.text();
    const parsed = JSON.parse(text);
    const res = await fetch("/api/teacher/lesson-plans/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonPlans: parsed.lessonPlans ?? parsed }),
    });
    const json = await res.json();
    if (!res.ok) {
      setStatus(json.error ?? "Import failed");
      return;
    }
    setStatus(`Imported ${json.imported} lesson plan(s).`);
  };

  return (
    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm text-sm">
      <p className="text-gray-600">
        Export your lesson plans as JSON for backup or move them between school years. Import accepts
        the same JSON format.
      </p>
      <button
        type="button"
        onClick={exportJson}
        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
      >
        Export JSON
      </button>
      <label className="block">
        <span className="font-medium text-gray-700">Import JSON file</span>
        <input
          type="file"
          accept="application/json,.json"
          className="mt-2 block text-sm"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) importJson(f);
          }}
        />
      </label>
      {status && <p className="text-gray-600">{status}</p>}
    </div>
  );
}

export function TeacherFeedbackClient() {
  const [category, setCategory] = useState("general");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<string | null>(null);

  const submit = async () => {
    setStatus(null);
    const res = await fetch("/api/teacher/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category, message }),
    });
    const json = await res.json();
    if (!res.ok) {
      setStatus(json.error ?? "Could not send feedback");
      return;
    }
    setMessage("");
    setStatus("Thank you — your feedback was sent to EMA administration.");
  };

  return (
    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm max-w-xl">
      <label className="block text-sm">
        <span className="font-medium text-gray-700">Category</span>
        <select
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option value="general">General</option>
          <option value="lesson-planner">Lesson planner</option>
          <option value="bug">Bug report</option>
          <option value="feature">Feature idea</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="font-medium text-gray-700">Message</span>
        <textarea
          className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2"
          rows={5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
      </label>
      <button
        type="button"
        onClick={submit}
        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
      >
        Send feedback
      </button>
      {status && <p className="text-sm text-gray-600">{status}</p>}
    </div>
  );
}
