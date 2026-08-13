"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function AdminGuardianLinksManager() {
  const router = useRouter();
  const [links, setLinks] = useState<Array<{
    _id: string;
    status: string;
    relationship: string;
    guardianId?: { name?: string; email?: string };
    studentId?: { name?: string; email?: string };
  }>>([]);
  const [form, setForm] = useState({ guardianId: "", studentId: "", relationship: "Parent" });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/guardian-links")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setLinks(json.data ?? []);
        setLoading(false);
      });
  }, []);

  async function approve(linkId: string, status: string) {
    await fetch("/api/admin/guardian-links", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ linkId, status }),
    });
    router.refresh();
    const res = await fetch("/api/admin/guardian-links");
    const json = await res.json();
    if (json.success) setLinks(json.data ?? []);
  }

  async function createLink(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/admin/guardian-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, status: "approved" }),
    });
    setForm({ guardianId: "", studentId: "", relationship: "Parent" });
    router.refresh();
    const res = await fetch("/api/admin/guardian-links");
    const json = await res.json();
    if (json.success) setLinks(json.data ?? []);
  }

  if (loading) return <p className="text-sm text-white/50">Loading guardian links…</p>;

  return (
    <div className="space-y-6">
      <form onSubmit={createLink} className="rounded-xl border border-white/10 bg-white/5 p-4 grid gap-3 sm:grid-cols-4">
        <input
          placeholder="Guardian User ID"
          value={form.guardianId}
          onChange={(e) => setForm({ ...form, guardianId: e.target.value })}
          className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
          required
        />
        <input
          placeholder="Student User ID"
          value={form.studentId}
          onChange={(e) => setForm({ ...form, studentId: e.target.value })}
          className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
          required
        />
        <input
          placeholder="Relationship"
          value={form.relationship}
          onChange={(e) => setForm({ ...form, relationship: e.target.value })}
          className="rounded-lg border border-white/10 bg-black/20 px-3 py-2 text-sm text-white"
        />
        <button type="submit" className="rounded-lg bg-explore-teal px-4 py-2 text-sm font-semibold text-white">
          Link Student
        </button>
      </form>

      <div className="space-y-2">
        {links.map((link) => (
          <div key={link._id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/5 px-4 py-3">
            <div className="text-sm text-white/80">
              <span className="font-medium">{link.guardianId?.name ?? "Guardian"}</span>
              {" → "}
              <span className="font-medium">{link.studentId?.name ?? "Student"}</span>
              <span className="ml-2 text-white/40">({link.relationship}) · {link.status}</span>
            </div>
            {link.status === "pending" && (
              <div className="flex gap-2">
                <button type="button" onClick={() => approve(link._id, "approved")} className="rounded bg-explore-teal px-3 py-1 text-xs text-white">Approve</button>
                <button type="button" onClick={() => approve(link._id, "rejected")} className="rounded bg-red-500/80 px-3 py-1 text-xs text-white">Reject</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
