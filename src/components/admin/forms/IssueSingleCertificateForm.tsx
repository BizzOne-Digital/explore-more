"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Award, FileText, Image as ImageIcon } from "lucide-react";
import {
  AdminSearchableSelect,
  type SearchableOption,
} from "@/components/admin/AdminSearchableSelect";
import { DragDropZone } from "@/components/admin/DragDropZone";
import { getCertificateFileUrl } from "@/lib/certificates/display";

interface StudentOption {
  _id: string;
  name: string;
  studentId?: string;
}

export function IssueSingleCertificateForm({ students }: { students: StudentOption[] }) {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [studentCodeInput, setStudentCodeInput] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().slice(0, 10));
  const [fileType, setFileType] = useState<"pdf" | "image">("pdf");
  const [publishToStudent, setPublishToStudent] = useState(true);
  const [filePath, setFilePath] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const studentOptions = useMemo<SearchableOption[]>(
    () =>
      students.map((student) => ({
        value: student._id,
        label: student.name,
        sublabel: student.studentId ? `Student ID ${student.studentId}` : undefined,
        searchText: [student.name, student.studentId, student._id]
          .filter(Boolean)
          .join(" ")
          .toLowerCase(),
      })),
    [students]
  );

  async function resolveStudentFromCode() {
    const trimmed = studentCodeInput.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setError("Enter a valid 6-digit Student ID.");
      return;
    }

    setError(null);
    const response = await fetch(`/api/admin/students`);
    const json = await response.json();
    if (!json.success) {
      setError("Unable to look up student.");
      return;
    }

    const match = (json.data as StudentOption[]).find((student) => student.studentId === trimmed);
    if (!match) {
      setError(`No student found with ID ${trimmed}.`);
      return;
    }

    setStudentId(match._id);
    setStudentCodeInput(trimmed);
  }

  async function uploadCertificateFile(file: File) {
    const isImage = file.type.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(file.name);
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    if (fileType === "image" && !isImage) {
      setError("Please select an image file.");
      return;
    }

    if (fileType === "pdf" && !isPdf) {
      setError("Please select a PDF file.");
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      setError("File exceeds the maximum upload size (50MB).");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileType", fileType);

      const res = await fetch("/api/admin/certificates/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? `Upload failed (${res.status})`);
        return;
      }

      if (!json.data?.path) {
        setError("Upload failed: server did not return a file path.");
        return;
      }

      setFilePath(json.data.path);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    let resolvedStudentId = studentId;
    if (!resolvedStudentId && /^\d{6}$/.test(studentCodeInput.trim())) {
      const userId = await fetch("/api/admin/students")
        .then((res) => res.json())
        .then((json) => {
          const match = (json.data as StudentOption[]).find(
            (student) => student.studentId === studentCodeInput.trim()
          );
          return match?._id ?? null;
        });
      resolvedStudentId = userId ?? "";
    }

    if (!resolvedStudentId) {
      setError("Select or enter a valid Student ID.");
      return;
    }

    if (!title.trim()) {
      setError("Certificate title is required.");
      return;
    }

    if (!filePath) {
      setError("Upload a certificate file before issuing.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch("/api/admin/certificates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: resolvedStudentId,
          title: title.trim(),
          description: description.trim() || undefined,
          issueDate,
          filePath,
          fileType,
          publishToStudent,
          isShareable: false,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? "Failed to issue certificate");
        return;
      }

      setSuccess(
        publishToStudent
          ? "Certificate issued and published to the student account."
          : "Certificate issued and saved as a draft."
      );

      setTimeout(() => {
        router.push("/admin/certificates");
        router.refresh();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to issue certificate");
    } finally {
      setSubmitting(false);
    }
  }

  const previewUrl = filePath ? getCertificateFileUrl(filePath) : "";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}
      {success ? (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          {success}
        </div>
      ) : null}

      <section className="rounded-lg border border-white/20 bg-white/10 p-6 space-y-4">
        <h3 className="font-semibold text-white">Student</h3>
        <AdminSearchableSelect
          label="Search by name or Student ID"
          placeholder="Search students..."
          searchHint="Type a name or 6-digit Student ID"
          value={studentId}
          onChange={(value) => {
            setStudentId(value);
            const match = students.find((student) => student._id === value);
            setStudentCodeInput(match?.studentId ?? "");
          }}
          options={studentOptions}
        />
        <div>
          <label className="mb-1 block text-xs text-white/60">Or enter Student ID</label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              type="text"
              inputMode="numeric"
              maxLength={6}
              value={studentCodeInput}
              onChange={(e) => {
                setStudentCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6));
                setStudentId("");
              }}
              placeholder="6-digit Student ID"
              className="flex-1 rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 font-mono text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => void resolveStudentFromCode()}
              className="rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
            >
              Find student
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-white/20 bg-white/10 p-6 space-y-4">
        <h3 className="font-semibold text-white">Certificate details</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-white/60">Certificate title / reason *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., Certificate of Completion"
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">Certificate type / template</label>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value as "pdf" | "image")}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white focus:border-white/40 focus:outline-none"
            >
              <option value="pdf">PDF certificate</option>
              <option value="image">Image certificate (PNG/JPG)</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-white/60">Issue date *</label>
            <input
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              required
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white focus:border-white/40 focus:outline-none"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs text-white/60">Notes (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
            />
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-white/20 bg-white/10 p-6 space-y-4">
        <h3 className="font-semibold text-white">Upload certificate</h3>
        <DragDropZone
          disabled={uploading}
          accept={fileType === "image" ? "image/*" : "application/pdf,.pdf"}
          onFiles={(files) => {
            const file = files[0];
            if (file) void uploadCertificateFile(file);
          }}
          className="rounded-xl border-2 border-dashed border-white/20 bg-white/5 p-8 text-center"
        >
          {({ openFilePicker }) => (
            <div className="space-y-3">
              {fileType === "pdf" ? (
                <FileText className="mx-auto h-10 w-10 text-explore-teal" />
              ) : (
                <ImageIcon className="mx-auto h-10 w-10 text-explore-teal" />
              )}
              <p className="text-sm text-white/70">
                Drag and drop a {fileType === "pdf" ? "PDF" : "image"} here, or{" "}
                <button
                  type="button"
                  onClick={openFilePicker}
                  className="font-semibold text-explore-teal hover:underline"
                >
                  browse files
                </button>
              </p>
              {uploading ? <p className="text-xs text-white/50">Uploading…</p> : null}
              {filePath ? (
                <p className="text-xs text-green-300">File uploaded and ready to issue.</p>
              ) : null}
            </div>
          )}
        </DragDropZone>

        {previewUrl ? (
          <div className="rounded-lg border border-white/10 bg-white/5 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/50">Preview</p>
            {fileType === "pdf" ? (
              <iframe src={previewUrl} title="Certificate preview" className="h-96 w-full rounded-lg bg-white" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Certificate preview" className="mx-auto max-h-96 rounded-lg" />
            )}
          </div>
        ) : null}
      </section>

      <label className="flex items-center gap-2 text-sm text-white/80">
        <input
          type="checkbox"
          checked={publishToStudent}
          onChange={(e) => setPublishToStudent(e.target.checked)}
          className="h-4 w-4 rounded border-white/30"
        />
        Publish to student account immediately
      </label>

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={submitting || uploading}
          className="inline-flex items-center gap-2 rounded-lg bg-explore-teal px-5 py-2.5 text-sm font-semibold text-white hover:bg-explore-teal/90 disabled:opacity-50"
        >
          <Award className="h-4 w-4" />
          {submitting ? "Issuing…" : "Issue Certificate"}
        </button>
        <Link
          href="/admin/certificates"
          className="rounded-lg border border-white/20 px-5 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}
