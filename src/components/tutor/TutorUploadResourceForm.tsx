"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader, Upload, FileText } from "lucide-react";
import { DragDropZone } from "@/components/admin/DragDropZone";
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
  const [uploadedFileName, setUploadedFileName] = useState("");
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
      setUploadedFileName(json.originalName || file.name);
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
      setUploadedFileName("");
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

      <div>
        <p className="text-sm font-medium text-explore-charcoal">Upload file</p>
        <DragDropZone
          disabled={uploading}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.png,.jpg,.jpeg,.webp,.gif,.mp4,.mov"
          onFiles={(files) => {
            const file = files[0];
            if (file) void handleFile(file);
          }}
          className="mt-1 cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-10 text-center transition-colors hover:border-violet-300 hover:bg-violet-50/40"
          dragActiveClassName="border-violet-500 bg-violet-50"
        >
          {({ dragOver, openFilePicker }) => (
            <div className="space-y-3">
              {uploading ? (
                <Loader className="mx-auto h-10 w-10 animate-spin text-violet-600" />
              ) : form.filePath ? (
                <FileText className="mx-auto h-10 w-10 text-green-600" />
              ) : (
                <Upload className={`mx-auto h-10 w-10 ${dragOver ? "text-violet-600" : "text-gray-400"}`} />
              )}
              <p className="text-base font-semibold text-explore-charcoal">
                {uploading
                  ? "Uploading your file…"
                  : form.filePath
                    ? "File ready to publish"
                    : dragOver
                      ? "Drop your file here"
                      : "Drag & drop your file here"}
              </p>
              <p className="text-sm text-gray-600">
                {uploading ? (
                  "Please wait while we upload your resource."
                ) : form.filePath ? (
                  <>
                    <span className="font-medium text-green-700">{uploadedFileName || "File uploaded"}</span>
                    {" · "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setForm((f) => ({ ...f, filePath: "" }));
                        setUploadedFileName("");
                      }}
                      className="font-semibold text-gray-500 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </>
                ) : (
                  <>
                    or{" "}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openFilePicker();
                      }}
                      className="font-semibold text-violet-600 hover:underline"
                    >
                      browse your computer
                    </button>{" "}
                    to choose a file
                  </>
                )}
              </p>
              {!form.filePath && !uploading && (
                <p className="text-xs text-gray-500">
                  PDF, Word, Excel, images, zip, or video — up to 25 MB
                </p>
              )}
            </div>
          )}
        </DragDropZone>
      </div>

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
