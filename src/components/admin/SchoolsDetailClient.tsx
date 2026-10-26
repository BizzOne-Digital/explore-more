"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type School = { _id: string; name: string; slug: string; district?: string; isActive?: boolean };
type TeacherRow = { _id: string; name: string; email: string };

export function SchoolsDetailClient({ schoolId }: { schoolId: string }) {
  const [school, setSchool] = useState<School | null>(null);
  const [teachers, setTeachers] = useState<TeacherRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(() => {
    setLoading(true);
    fetch(`/api/admin/schools/${schoolId}`)
      .then((r) => r.json())
      .then((json) => {
        if (!json.success) {
          setSchool(null);
          setTeachers([]);
          return;
        }
        setSchool(json.data.school as School);
        setTeachers(json.data.teachers ?? []);
      })
      .catch(() => {
        setSchool(null);
        setTeachers([]);
      })
      .finally(() => setLoading(false));
  }, [schoolId]);

  useEffect(() => {
    queueMicrotask(() => load());
  }, [load]);

  if (loading) return <p className="text-white/60">Loading school…</p>;
  if (!school) {
    return (
      <p className="text-white/60">
        School not found. <Link href="/admin/schools" className="text-explore-teal">Back</Link>
      </p>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/admin/schools" className="text-sm text-explore-teal hover:underline">
        ← Schools
      </Link>
      <h1 className="text-2xl font-bold text-white">{school.name}</h1>
      <p className="text-sm text-white/50">
        Slug: <span className="font-mono">{school.slug}</span>
        {school.district ? ` · ${school.district}` : ""}
      </p>

      <section className="rounded-lg border border-white/10 bg-white/5 p-6">
        <h2 className="text-lg font-semibold text-white">Teachers at this school</h2>
        <p className="mt-1 text-sm text-white/55">
          Assign teachers to this school on Admin → Users → teacher profile → School.
        </p>
        {teachers.length === 0 ? (
          <p className="mt-4 text-sm text-white/50">No teachers linked yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {teachers.map((t) => (
              <li key={t._id}>
                <Link
                  href={`/admin/users/${t._id}`}
                  className="text-explore-teal hover:underline"
                >
                  {t.name}
                </Link>
                <span className="ml-2 text-xs text-white/40">{t.email}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
