"use client";

import { useCallback, useEffect, useState } from "react";
import { Building2, Plus } from "lucide-react";

type SchoolRow = {
  _id: string;
  name: string;
  slug: string;
  district?: string;
  isActive?: boolean;
};

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function SchoolsAdminClient() {
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [district, setDistrict] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    fetch("/api/admin/schools")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setSchools(json.data.schools ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createSchool(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const finalSlug = slug.trim() || slugify(name);
    try {
      const res = await fetch("/api/admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: finalSlug,
          district: district.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Create failed");
      setName("");
      setSlug("");
      setDistrict("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Create failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-white">
          <Building2 className="h-7 w-7 text-explore-teal" />
          Schools
        </h1>
        <p className="mt-2 text-sm text-white/60">
          Register schools for the Teacher Portal. Assign teachers to a school on their user profile
          so colleague messaging stays within that school.
        </p>
      </div>

      <form
        onSubmit={createSchool}
        className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6"
      >
        <h2 className="flex items-center gap-2 text-lg font-semibold text-white">
          <Plus className="h-5 w-5" />
          Add school
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm text-white/80">School name</label>
            <input
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slug) setSlug(slugify(e.target.value));
              }}
              placeholder="Middleton Elementary"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-white/80">URL slug</label>
            <input
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="middleton-elementary"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 font-mono text-sm text-white"
            />
          </div>
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm text-white/80">District (optional)</label>
            <input
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="Charles County Public Schools"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-explore-teal px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {saving ? "Creating…" : "Create school"}
        </button>
      </form>

      <div className="rounded-lg border border-white/10 bg-white/5 p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Registered schools</h2>
        {loading ? (
          <p className="text-sm text-white/50">Loading…</p>
        ) : schools.length === 0 ? (
          <p className="text-sm text-white/50">No schools yet.</p>
        ) : (
          <ul className="divide-y divide-white/10">
            {schools.map((s) => (
              <li key={s._id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <div>
                  <p className="font-medium text-white">{s.name}</p>
                  <p className="text-xs text-white/40">
                    <span className="font-mono">{s.slug}</span>
                    {s.district ? ` · ${s.district}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
