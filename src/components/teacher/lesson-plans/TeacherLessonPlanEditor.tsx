"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  DETAILED_PLAN_SECTIONS,
  QUICK_PLAN_SECTIONS,
  type LessonPlanFieldKey,
} from "@/lib/teacher/lesson-plan-fields";

type PlanForm = Record<string, string>;

const META_KEYS = ["title", "subject", "grade", "date", "duration", "status", "unit"] as const;

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Request failed");
  return data as T;
}

function toForm(item: Record<string, unknown>): PlanForm {
  const form: PlanForm = { planMode: String(item.planMode ?? "quick") };
  for (const key of [...META_KEYS, ...QUICK_PLAN_SECTIONS.map((s) => s.key), ...DETAILED_PLAN_SECTIONS.map((s) => s.key)]) {
    const v = item[key];
    if (key === "date" && v) {
      form.date = new Date(String(v)).toISOString().slice(0, 10);
    } else if (v != null && v !== "") {
      form[key] = String(v);
    }
  }
  return form;
}

export function TeacherLessonPlanEditor({
  planId,
  initialMode = "quick",
}: {
  planId?: string;
  initialMode?: "quick" | "detailed";
}) {
  const router = useRouter();
  const [form, setForm] = useState<PlanForm>({
    planMode: initialMode,
    status: "draft",
    title: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const [loading, setLoading] = useState(!!planId);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [revisions, setRevisions] = useState<Array<{ _id: string; createdAt: string; note?: string }>>([]);

  const planMode = form.planMode === "detailed" ? "detailed" : "quick";
  const sections = planMode === "detailed" ? DETAILED_PLAN_SECTIONS : QUICK_PLAN_SECTIONS;

  const load = useCallback(() => {
    if (!planId) return;
    setLoading(true);
    api<{ item: Record<string, unknown> }>(`/api/teacher/workspace/lesson-plans?id=${planId}`)
      .then((d) => {
        if (d.item) setForm(toForm(d.item));
      })
      .catch(() => setMessage("Could not load lesson plan."))
      .finally(() => setLoading(false));
    api<{ items: typeof revisions }>(`/api/teacher/lesson-plans/${planId}/revisions`)
      .then((d) => setRevisions(d.items ?? []))
      .catch(() => setRevisions([]));
  }, [planId]);

  useEffect(() => {
    queueMicrotask(() => load());
  }, [load]);

  const buildPayload = () => {
    const body: Record<string, unknown> = { planMode };
    for (const [key, value] of Object.entries(form)) {
      if (value !== "") body[key] = value;
    }
    return body;
  };

  const save = async () => {
    if (!form.title?.trim()) {
      setMessage("Title is required.");
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      const body = buildPayload();
      if (planId) {
        await api("/api/teacher/workspace/lesson-plans", {
          method: "PATCH",
          body: JSON.stringify({ id: planId, ...body }),
        });
        setMessage("Saved.");
        load();
      } else {
        const res = await api<{ item: { _id: string } }>("/api/teacher/workspace/lesson-plans", {
          method: "POST",
          body: JSON.stringify(body),
        });
        router.replace(`/teacher/lesson-plans/${res.item._id}`);
      }
    } catch {
      setMessage("Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const runAi = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setMessage(null);
    try {
      const res = await api<{ suggestion: string }>("/api/teacher/lesson-plans/ai", {
        method: "POST",
        body: JSON.stringify({ prompt: aiPrompt, planMode }),
      });
      setForm((p) => ({ ...p, instruction: res.suggestion }));
      setMessage("AI suggestion added to Instruction — review and edit before saving.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "AI assist unavailable.");
    } finally {
      setAiLoading(false);
    }
  };

  const duplicate = async () => {
    if (!planId) return;
    const res = await api<{ item: { _id: string } }>(
      `/api/teacher/lesson-plans/${planId}/duplicate`,
      { method: "POST" }
    );
    router.push(`/teacher/lesson-plans/${res.item._id}`);
  };

  const setField = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  if (loading) {
    return <p className="text-sm text-gray-500">Loading lesson plan…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link href="/teacher/lesson-plans" className="text-sm text-violet-700 hover:underline">
          ← All lesson plans
        </Link>
        {planId && (
          <>
            <a
              href={`/api/teacher/lesson-plans/${planId}/pdf`}
              className="text-sm text-violet-700 hover:underline"
            >
              Download PDF
            </a>
            <Link
              href={`/teacher/lesson-plans/${planId}/print`}
              className="text-sm text-violet-700 hover:underline"
            >
              Print view
            </Link>
            <button type="button" onClick={duplicate} className="text-sm text-violet-700 hover:underline">
              Duplicate
            </button>
          </>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {(["quick", "detailed"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => setField("planMode", mode)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
              planMode === mode
                ? "bg-violet-600 text-white"
                : "border border-gray-200 bg-white text-gray-700"
            }`}
          >
            {mode === "quick" ? "Quick plan" : "Detailed plan"}
          </button>
        ))}
      </div>

      <div className="grid gap-4 rounded-2xl bg-white p-6 shadow-sm sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          <span className="font-medium text-gray-700">Lesson title</span>
          <input
            className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            value={form.title ?? ""}
            onChange={(e) => setField("title", e.target.value)}
          />
        </label>
        {META_KEYS.filter((k) => k !== "title").map((key) => (
          <label key={key} className="block text-sm">
            <span className="font-medium capitalize text-gray-700">{key.replace(/([A-Z])/g, " $1")}</span>
            {key === "status" ? (
              <select
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={form.status ?? "draft"}
                onChange={(e) => setField("status", e.target.value)}
              >
                {["draft", "ready", "taught", "reteach", "completed"].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            ) : (
              <input
                type={key === "date" ? "date" : "text"}
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
                value={form[key] ?? ""}
                onChange={(e) => setField(key, e.target.value)}
              />
            )}
          </label>
        ))}
      </div>

      <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <h3 className="font-semibold text-explore-charcoal">AI assist</h3>
        <textarea
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
          rows={3}
          placeholder="Describe your class, topic, and goals…"
          value={aiPrompt}
          onChange={(e) => setAiPrompt(e.target.value)}
        />
        <button
          type="button"
          disabled={aiLoading}
          onClick={runAi}
          className="rounded-lg border border-violet-200 px-4 py-2 text-sm font-medium text-violet-700 disabled:opacity-50"
        >
          {aiLoading ? "Generating…" : "Suggest plan content"}
        </button>
      </div>

      <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        {sections.map((section) => (
          <label key={section.key} className="block text-sm">
            <span className="font-medium text-gray-700">{section.label}</span>
            <textarea
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              rows={section.rows ?? 3}
              value={form[section.key as LessonPlanFieldKey] ?? ""}
              onChange={(e) => setField(section.key, e.target.value)}
            />
          </label>
        ))}
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save lesson plan"}
        </button>
        {planId && (
          <>
            <button
              type="button"
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm"
              onClick={async () => {
                await api("/api/teacher/workspace/lesson-plans", {
                  method: "PATCH",
                  body: JSON.stringify({ id: planId, isTemplate: true }),
                });
                setMessage("Saved as template — find it under Templates.");
              }}
            >
              Save as template
            </button>
            <button
              type="button"
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm"
              onClick={async () => {
                await api("/api/teacher/workspace/lesson-plans", {
                  method: "PATCH",
                  body: JSON.stringify({ id: planId, archived: true }),
                });
                router.push("/teacher/archive");
              }}
            >
              Archive
            </button>
          </>
        )}
      </div>

      {message && <p className="text-sm text-gray-600">{message}</p>}

      {planId && revisions.length > 0 && (
        <section className="rounded-2xl bg-white p-5 shadow-sm text-sm">
          <h3 className="font-semibold text-explore-charcoal">Revision history</h3>
          <ul className="mt-2 space-y-1 text-gray-600">
            {revisions.map((r) => (
              <li key={r._id}>
                {new Date(r.createdAt).toLocaleString()}
                {r.note ? ` — ${r.note}` : ""}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
