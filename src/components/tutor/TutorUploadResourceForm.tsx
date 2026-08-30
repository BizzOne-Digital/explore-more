"use client";

import { useEffect, useState } from "react";
import { Loader } from "lucide-react";
import {
  TUTOR_RESOURCE_TYPES,
  TUTOR_RESOURCE_TYPE_LABELS,
} from "@/lib/tutor/constants";

type StudentOption = { studentId: string; studentName: string };

export function TutorUploadResourceForm() {
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({
    studentId: "",
    type: "worksheet",
    title: "",
    description: "",
    url: "",
    filePath: "",
    publishToStudent: true,
  });

  useEffect(() => {
    fetch("/api/tutor/students")
      .then((r) => r.json())
      .then((json) => setStudents(json.students ?? []))
      .catch(() => {});
  }, []);

  async function handleFile(file: File) {
    setUploading(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/tutor/resources/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      setForm((f) => ({ ...f, filePath: json.filePath }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/tutor/resources", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          type: form.type,
          url: form.url || undefined,
          filePath: form.filePath || undefined,
          studentId: form.publishToStudent ? form.studentId : undefined,
          isPublic: !form.studentId,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to publish");
      setSuccess("Resource published successfully.");
      setForm({
        studentId: "",
        type: "worksheet",
        title: "",
        description: "",
        url: "",
        filePath: "",
        publishToStudent: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to publish");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl bg-white p-6 shadow-sm">
      {error && <p className="text-sm text-red-600">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <label className="block text-sm font-medium">
        Student
        <select
          required={form.publishToStudent}
          value={form.studentId}
          onChange={(e) => setForm({ ...form, studentId: e.target.value })}
          className="mt-1 w-full rounded-lg border px-3 py-2"
        >
          <option value="">Select student…</option>
          {students.map((s) => (
            <option key={s.studentId} value={s.studentId}>
              {s.studentName}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium">
        Resource Type
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
          className="mt-1 w-full rounded-lg border px-3 py-2"
        >
          {TUTOR_RESOURCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {TUTOR_RESOURCE_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm font-medium">
        Title
        <input
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </label>

      <label className="block text-sm font-medium">
        Description
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </label>

      <label className="block text-sm font-medium">
        File
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
          className="mt-1 w-full text-sm"
        />
        {uploading && (
          <span className="mt-1 flex items-center gap-2 text-sm text-gray-500">
            <Loader className="h-4 w-4 animate-spin" /> Uploading…
          </span>
        )}
        {form.filePath && <p className="mt-1 text-xs text-green-600">File uploaded</p>}
      </label>

      <label className="block text-sm font-medium">
        Or link URL
        <input
          type="url"
          value={form.url}
          onChange={(e) => setForm({ ...form, url: e.target.value })}
          placeholder="https://"
          className="mt-1 w-full rounded-lg border px-3 py-2"
        />
      </label>

      <button
        type="submit"
        disabled={loading || uploading}
        className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Publishing…" : "Publish Resource"}
      </button>
    </form>
  );
}
