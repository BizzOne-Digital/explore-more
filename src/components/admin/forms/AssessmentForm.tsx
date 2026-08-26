"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Upload, FileText, X } from "lucide-react";
import { FormField, FormSection } from "@/components/admin/forms";
import { PageHeader } from "@/components/admin/PageHeader";
import { DragDropZone } from "@/components/admin/DragDropZone";
import { formatGradeLabel } from "@/lib/grades";

export function AssessmentForm({ grade }: { grade: string }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [filePath, setFilePath] = useState("");
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function uploadPdf(file: File) {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("Please upload a PDF file.");
      return;
    }
    if (file.size > 30 * 1024 * 1024) {
      setError("PDF must be 30 MB or smaller.");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/assessments/upload", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Upload failed");
        return;
      }
      setFilePath(json.data.path);
      setFileName(file.name);
    } catch {
      setError("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!title.trim()) {
      setError("Assessment name is required");
      return;
    }
    if (!filePath) {
      setError("Please upload a PDF");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), grade, filePath }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Save failed");
        return;
      }

      const count = json.data?.notify?.notifiedCount ?? 0;
      setSuccess(
        count > 0
          ? `Assessment created and sent to ${count} parent${count === 1 ? "" : "s"}.`
          : "Assessment created. No linked parents found for this grade."
      );

      setTimeout(() => {
        router.push(`/admin/assessments?grade=${encodeURIComponent(grade)}`);
        router.refresh();
      }, 1200);
    } catch {
      setError("Save failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <PageHeader
        title={`New Assessment — ${formatGradeLabel(grade)}`}
        description="Upload a PDF assessment for all parents in this grade"
      />

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title="Assessment">
          <FormField label="Name" required className="sm:col-span-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Math Unit 3 Test"
              className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-2.5 text-white placeholder:text-white/40"
            />
          </FormField>

          <FormField label="PDF (max 30 MB)" required className="sm:col-span-2">
            {filePath ? (
              <div className="flex items-center gap-3 rounded-lg border border-white/20 bg-white/5 px-4 py-3">
                <FileText className="h-5 w-5 text-explore-teal" />
                <span className="flex-1 truncate text-sm text-white">{fileName}</span>
                <button
                  type="button"
                  onClick={() => {
                    setFilePath("");
                    setFileName("");
                  }}
                  className="text-white/50 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <DragDropZone
                disabled={uploading}
                accept="application/pdf,.pdf"
                onFiles={(files) => uploadPdf(files[0])}
                className="flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-white/5 px-6 py-10 transition hover:border-explore-teal/50"
                dragActiveClassName="border-explore-teal bg-explore-teal/10"
              >
                {({ dragOver }) => (
                  <>
                    <Upload className={`mb-2 h-8 w-8 ${dragOver ? "text-explore-teal" : "text-white/40"}`} />
                    <span className="text-sm font-medium text-white/80">
                      {uploading ? "Uploading…" : dragOver ? "Drop PDF here" : "Drag & drop PDF here"}
                    </span>
                    <span className="mt-1 text-xs text-white/50">or click to browse (max 30 MB)</span>
                  </>
                )}
              </DragDropZone>
            )}
          </FormField>
        </FormSection>

        <div className="flex items-center gap-3 border-t border-white/10 pt-6">
          <button
            type="submit"
            disabled={submitting || uploading}
            className="rounded-lg bg-explore-lime px-5 py-2 text-sm font-semibold text-explore-black disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Upload & Notify Parents"}
          </button>
          <Link
            href={`/admin/assessments?grade=${encodeURIComponent(grade)}`}
            className="rounded-lg border border-white/10 px-5 py-2 text-sm text-white/60 hover:text-white"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
