"use client";

import { useEffect, useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import Link from "next/link";

type SchoolOption = { _id: string; name: string; slug: string; district?: string };

interface TeacherSchoolAssignmentCardProps {
  userId: string;
  userName: string;
  initialSchool?: {
    _id: string;
    name: string;
    slug: string;
  } | null;
  initialJobTitle?: string | null;
}

export function TeacherSchoolAssignmentCard({
  userId,
  userName,
  initialSchool = null,
  initialJobTitle = null,
}: TeacherSchoolAssignmentCardProps) {
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [schoolId, setSchoolId] = useState(initialSchool?._id ?? "");
  const [jobTitle, setJobTitle] = useState(initialJobTitle ?? "");
  const [assignedSchool, setAssignedSchool] = useState(initialSchool);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/schools")
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled && json.success) setSchools(json.data.schools ?? []);
      })
      .finally(() => {
        if (!cancelled) setLoadingSchools(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveAssignment() {
    if (!schoolId) {
      setError("Select a school.");
      return;
    }
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/schools", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, schoolId, jobTitle: jobTitle.trim() || undefined }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Save failed");
      const school = schools.find((s) => s._id === schoolId);
      setAssignedSchool(school ? { _id: school._id, name: school.name, slug: school.slug } : null);
      setMessage(`${userName} is now registered at ${school?.name ?? "the selected school"}.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-teal-500/20 bg-teal-500/5 p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-lg bg-teal-500/10 p-2">
          <Building2 className="h-5 w-5 text-teal-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">School registration (Teacher Portal)</h3>
          <p className="mt-1 text-sm text-white/60">
            Colleague messaging and school-scoped tools use this assignment. Teachers at Middleton
            Elementary only see colleagues at Middleton—not other schools.
          </p>
        </div>
      </div>

      {assignedSchool ? (
        <p className="mb-4 text-sm text-white/80">
          Current school:{" "}
          <strong className="text-teal-300">{assignedSchool.name}</strong>
          <span className="ml-2 font-mono text-xs text-white/40">{assignedSchool.slug}</span>
          {jobTitle ? <span className="ml-2 text-white/50">· {jobTitle}</span> : null}
        </p>
      ) : (
        <p className="mb-4 text-sm text-amber-200/90">
          No school assigned yet — this teacher cannot use colleague messaging until you assign one.
        </p>
      )}

      {loadingSchools ? (
        <div className="flex items-center gap-2 text-sm text-white/50">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading schools…
        </div>
      ) : schools.length === 0 ? (
        <p className="text-sm text-white/60">
          No schools in the system yet.{" "}
          <Link href="/admin/schools" className="text-explore-teal hover:underline">
            Add a school
          </Link>{" "}
          first.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">School</label>
            <select
              value={schoolId}
              onChange={(e) => setSchoolId(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
            >
              <option value="">Select school…</option>
              {schools.map((s) => (
                <option key={s._id} value={s._id} className="bg-explore-charcoal">
                  {s.name}
                  {s.district ? ` (${s.district})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-white/80">
              Job title (optional)
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. 4th Grade Teacher"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder:text-white/30 focus:border-explore-teal focus:outline-none focus:ring-1 focus:ring-explore-teal"
            />
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={saveAssignment}
          disabled={saving || !schoolId || schools.length === 0}
          className="rounded-lg bg-explore-teal px-4 py-2 text-sm font-medium text-white transition hover:bg-explore-teal/90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save school assignment"}
        </button>
        <Link
          href="/admin/schools"
          className="text-sm text-white/50 hover:text-explore-teal hover:underline"
        >
          Manage schools
        </Link>
      </div>

      {message && <p className="mt-3 text-sm text-teal-300">{message}</p>}
      {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
    </div>
  );
}
