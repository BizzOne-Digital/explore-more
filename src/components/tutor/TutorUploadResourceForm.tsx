"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader } from "lucide-react";
import {
  TUTOR_RESOURCE_TYPES,
  TUTOR_RESOURCE_TYPE_LABELS,
} from "@/lib/tutor/constants";
import {
  TutorSearchableSelect,
  type TutorSearchableOption,
} from "@/components/tutor/TutorSearchableSelect";

type StudentOption = {
  studentId: string;
  studentName: string;
  studentNumber?: string;
  grade?: string;
};

type PublishAudience = "single" | "all";

export function TutorUploadResourceForm() {
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [audience, setAudience] = useState<PublishAudience>("single");
  const [form, setForm] = useState({
    studentId: "",
    type: "worksheet",
    title: "",
    description: "",
    url: "",
    filePath: "",
  });

  useEffect(() => {
    setStudentsLoading(true);
    fetch("/api/tutor/students")
      .then((r) => r.json())
      .then((json) => setStudents(json.students ?? []))
      .catch(() => setStudents([]))
      .finally(() => setStudentsLoading(false));
  }, []);

  const studentOptions = useMemo<TutorSearchableOption[]>(
    () =>
      students.map((student) => ({
        value: student.studentId,
        label: student.studentName,
        sublabel: [
          student.studentNumber ? `Student ID ${student.studentNumber}` : null,
          student.grade ? `Grade ${student.grade}` : null,
        ]
          .filter(Boolean)
          .join(" · ") || undefined,
        searchText: [student.studentName, student.studentNumber, student.studentId, student.grade]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      })),
    [students]
  );

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

    if (audience === "single" && !form.studentId) {
      setError("Please select a student by name or Student ID.");
      setLoading(false);
      return;
    }

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
          audience,
          studentId: audience === "single" ? form.studentId : undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to publish");

      setSuccess(
        audience === "all"
          ? `Resource published to all ${students.length} student${students.length === 1 ? "" : "s"}.`
          : "Resource published successfully."
      );
      setForm({
        studentId: "",
        type: "worksheet",
        title: "",
        description: "",
        url: "",
        filePath: "",
      });
      setAudience("single");
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

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-explore-charcoal">Publish to</legend>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="audience"
              checked={audience === "single"}
              onChange={() => setAudience("single")}
            />
            One student
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="audience"
              checked={audience === "all"}
              onChange={() => {
                setAudience("all");
                setForm((f) => ({ ...f, studentId: "" }));
              }}
            />
            All students
          </label>
        </div>
        {audience === "all" ? (
          <p className="text-xs text-gray-500">
            {studentsLoading
              ? "Loading students…"
              : students.length > 0
                ? `This resource will be shared with all ${students.length} active student${students.length === 1 ? "" : "s"}.`
                : "No students are available to publish to yet."}
          </p>
        ) : studentsLoading ? (
          <p className="text-xs text-gray-500">Loading students…</p>
        ) : students.length === 0 ? (
          <p className="text-sm text-amber-700">
            No students found. Administrators need active student accounts; tutors need students
            assigned in Admin → Users.
          </p>
        ) : (
          <TutorSearchableSelect
            label="Student"
            placeholder="Search by name or Student ID…"
            searchHint="Type a student name or 6-digit Student ID"
            value={form.studentId}
            onChange={(studentId) => setForm({ ...form, studentId })}
            options={studentOptions}
          />
        )}
      </fieldset>

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
        disabled={loading || uploading || studentsLoading || (audience === "all" && students.length === 0)}
        className="rounded-lg bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Publishing…" : "Publish Resource"}
      </button>
    </form>
  );
}
