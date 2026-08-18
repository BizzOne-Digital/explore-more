"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface UserOption {
  _id: string;
  name: string;
  email: string;
  studentId?: string;
}

interface GuardianLink {
  _id: string;
  status: string;
  relationship: string;
  guardianId?: { name?: string; email?: string };
  studentId?: { name?: string; email?: string; studentId?: string };
}

export function AdminGuardianLinksManager() {
  const router = useRouter();
  const [links, setLinks] = useState<GuardianLink[]>([]);
  const [parents, setParents] = useState<UserOption[]>([]);
  const [students, setStudents] = useState<UserOption[]>([]);
  const [form, setForm] = useState({ guardianId: "", studentId: "", relationship: "Parent" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadData() {
    const [linksRes, usersRes] = await Promise.all([
      fetch("/api/admin/guardian-links"),
      fetch("/api/admin/users"),
    ]);
    const linksJson = await linksRes.json();
    const usersJson = await usersRes.json();

    if (linksJson.success) setLinks(linksJson.data ?? []);
    if (usersJson.success) {
      const users = usersJson.data ?? [];
      setParents(users.filter((u: UserOption & { role: string }) => u.role === "parent"));
      setStudents(users.filter((u: UserOption & { role: string }) => u.role === "student"));
    }
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function approve(linkId: string, status: string) {
    await fetch("/api/admin/guardian-links", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkId, status }),
    });
    router.refresh();
    await loadData();
  }

  async function createLink(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/guardian-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, status: "approved" }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Failed to create link");
        return;
      }
      setForm({ guardianId: "", studentId: "", relationship: "Parent" });
      router.refresh();
      await loadData();
    } catch {
      setError("Failed to create link");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-sm text-white/50">Loading guardian links…</p>;

  return (
    <div className="space-y-6">
      <form onSubmit={createLink} className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-3">
        <p className="text-sm text-white/60">
          Link a parent account to a student using the student&apos;s <strong className="text-explore-teal">Student ID</strong> from Admin → Students.
        </p>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs text-white/60">Parent Account</label>
            <select
              value={form.guardianId}
              onChange={(e) => setForm({ ...form, guardianId: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
              required
            >
              <option value="">Select parent…</option>
              {parents.map((parent) => (
                <option key={parent._id} value={parent._id}>
                  {parent.name} ({parent.email})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">Student</label>
            <select
              value={form.studentId}
              onChange={(e) => setForm({ ...form, studentId: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
              required
            >
              <option value="">Select student…</option>
              {students.map((student) => (
                <option key={student._id} value={student.studentId || student._id}>
                  {student.name}
                  {student.studentId ? ` — ${student.studentId}` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">Relationship</label>
            <input
              placeholder="Parent"
              value={form.relationship}
              onChange={(e) => setForm({ ...form, relationship: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-lg bg-explore-teal px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submitting ? "Linking…" : "Link Student"}
            </button>
          </div>
        </div>
      </form>

      <div className="space-y-2">
        {links.length === 0 ? (
          <p className="text-sm text-white/40">No guardian links yet.</p>
        ) : (
          links.map((link) => (
            <div
              key={link._id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3"
            >
              <div className="text-sm text-white/80">
                <span className="font-medium">{link.guardianId?.name ?? "Guardian"}</span>
                {" → "}
                <span className="font-medium">{link.studentId?.name ?? "Student"}</span>
                {link.studentId?.studentId && (
                  <span className="ml-2 font-mono text-xs text-explore-teal">
                    {link.studentId.studentId}
                  </span>
                )}
                <span className="ml-2 text-white/40">
                  ({link.relationship}) · {link.status}
                </span>
              </div>
              {link.status === "pending" && (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => approve(link._id, "approved")}
                    className="rounded bg-explore-teal px-3 py-1 text-xs text-white"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => approve(link._id, "rejected")}
                    className="rounded bg-red-500/80 px-3 py-1 text-xs text-white"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
