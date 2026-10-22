"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type PlanRow = {
  _id: string;
  title: string;
  subject?: string;
  grade?: string;
  date?: string;
  status?: string;
  planMode?: string;
};

export function TeacherLessonPlansHub() {
  const [items, setItems] = useState<PlanRow[]>([]);

  const load = useCallback(() => {
    fetch("/api/teacher/workspace/lesson-plans")
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => setItems([]));
  }, []);

  useEffect(() => {
    queueMicrotask(() => load());
  }, [load]);

  const label = (p: PlanRow) => {
    const parts = [p.subject, p.grade, p.status].filter(Boolean);
    const date = p.date ? new Date(p.date).toLocaleDateString() : "";
    return `${parts.join(" · ")}${date ? ` · ${date}` : ""}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Link
          href="/teacher/lesson-plans/new?mode=quick"
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white"
        >
          New quick plan
        </Link>
        <Link
          href="/teacher/lesson-plans/new?mode=detailed"
          className="rounded-lg border border-violet-200 px-4 py-2 text-sm font-medium text-violet-700"
        >
          New detailed plan
        </Link>
        <Link href="/teacher/templates" className="text-sm text-violet-700 hover:underline self-center">
          Templates
        </Link>
        <Link href="/teacher/archive" className="text-sm text-violet-700 hover:underline self-center">
          Archive
        </Link>
      </div>

      <ul className="space-y-2">
        {items.map((p) => (
          <li key={p._id}>
            <Link
              href={`/teacher/lesson-plans/${p._id}`}
              className="flex flex-wrap justify-between gap-2 rounded-xl bg-white px-4 py-3 shadow-sm hover:border-violet-200 border border-transparent"
            >
              <span className="font-medium text-explore-charcoal">{p.title}</span>
              <span className="text-sm text-gray-500">{label(p)}</span>
            </Link>
          </li>
        ))}
        {items.length === 0 && (
          <li className="text-sm text-gray-500">No lesson plans yet — create your first plan above.</li>
        )}
      </ul>
    </div>
  );
}
