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
  const [busy, setBusy] = useState(false);

  const exportPdfZip = async () => {
    setStatus(null);
    setBusy(true);
    try {
      const res = await fetch("/api/teacher/lesson-plans/export/pdf");
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setStatus(json.error ?? "PDF export failed");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("Content-Disposition")?.match(/filename="([^"]+)"/)?.[1] ??
        "ema-lesson-plans.zip";
      a.click();
      URL.revokeObjectURL(url);
      setStatus("Downloaded a ZIP with one PDF per lesson plan for this school year.");
    } catch {
      setStatus("PDF export failed.");
    } finally {
      setBusy(false);
    }
  };

  const importPdf = async (fileList: FileList | null) => {
    if (!fileList?.length) return;
    setStatus(null);
    setBusy(true);
    const form = new FormData();
    for (const file of Array.from(fileList)) {
      form.append("files", file);
    }
    try {
      const res = await fetch("/api/teacher/lesson-plans/import/pdf", {
        method: "POST",
        body: form,
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus(json.error ?? "PDF import failed");
        return;
      }
      const skipped = typeof json.skipped === "number" ? json.skipped : 0;
      let msg = `Imported ${json.imported ?? 0} lesson plan(s) from PDF.`;
      if (skipped > 0) msg += ` Skipped ${skipped} duplicate(s).`;
      if (json.errors?.length) msg += ` Some files had issues: ${json.errors.join("; ")}`;
      setStatus(msg);
    } catch {
      setStatus("PDF import failed.");
    } finally {
      setBusy(false);
    }
  };

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
    const skipped = typeof json.skipped === "number" ? json.skipped : 0;
    setStatus(
      `Imported ${json.imported ?? 0} lesson plan(s).` +
        (skipped > 0 ? ` Skipped ${skipped} duplicate(s).` : "")
    );
  };

  return (
    <div className="space-y-6 text-sm">
      <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-explore-charcoal">PDF (recommended)</h3>
        <p className="text-gray-600">
          <strong>Export:</strong> downloads a ZIP folder with <strong>one PDF per lesson plan</strong>{" "}
          (same layout as Download PDF on each plan). Handy for printing, email, or archiving.
        </p>
        <p className="text-gray-600">
          <strong>Import:</strong> upload one or more PDFs (ideally exported from this site). Each file
          becomes a <strong>draft</strong> lesson plan; section headings are filled in when we can read
          them from the PDF.
        </p>
        <p className="text-xs text-gray-500">
          <strong>Combined vs per plan:</strong> we use <strong>one PDF per plan</strong> inside a ZIP,
          not a single merged PDF — easier to open, print, and re-import one lesson at a time.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={exportPdfZip}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Export all as PDFs (ZIP)
        </button>
        <label className="block">
          <span className="font-medium text-gray-700">Import PDF file(s)</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            multiple
            disabled={busy}
            className="mt-2 block text-sm"
            onChange={(e) => {
              importPdf(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </section>

      <section className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-explore-charcoal">JSON (advanced backup)</h3>
        <p className="text-gray-600">
          Full data backup for moving plans between school years or restoring every field exactly.
          Import accepts the same JSON format.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={exportJson}
          className="rounded-lg border border-violet-200 bg-white px-4 py-2 text-sm font-medium text-violet-800 disabled:opacity-60"
        >
          Export JSON
        </button>
        <label className="block">
          <span className="font-medium text-gray-700">Import JSON file</span>
          <input
            type="file"
            accept="application/json,.json"
            disabled={busy}
            className="mt-2 block text-sm"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) importJson(f);
              e.target.value = "";
            }}
          />
        </label>
      </section>

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
