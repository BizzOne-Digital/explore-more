"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader, Paperclip, Upload, X } from "lucide-react";
import { cn } from "@/lib/cn";

export function AttendanceExcuseForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [sessionDate, setSessionDate] = useState("");
  const [note, setNote] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  function pickFile(file: File | undefined) {
    if (!file) return;
    setAttachment(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      let docPath: string | undefined;

      if (attachment) {
        const fd = new FormData();
        fd.append("file", attachment);
        const uploadRes = await fetch("/api/parent/attendance/upload", {
          method: "POST",
          body: fd,
        });
        const uploadData = await uploadRes.json();
        if (!uploadData.success) {
          throw new Error(uploadData.error || "Failed to upload attachment");
        }
        docPath = uploadData.data.path;
      }

      const res = await fetch("/api/parent/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, sessionDate, note, docPath }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || "Failed to submit excuse");

      setMessage("Absence excuse submitted successfully. It now appears in your attendance records below.");
      setSessionDate("");
      setNote("");
      setAttachment(null);
      const month = sessionDate.slice(0, 7);
      router.push(`/parent/attendance?student=${studentId}&month=${month}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-white p-6 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-explore-teal" />
        <h3 className="font-semibold text-explore-charcoal">Submit Absence / Excuse Note</h3>
      </div>
      <p className="text-sm text-explore-charcoal/60">
        Submit an explanation for an absence. You can attach a doctor&apos;s note or other supporting
        document. The day will be marked <strong>Excused</strong> in your attendance records.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-explore-charcoal/70">Session Date</label>
          <input
            type="date"
            value={sessionDate}
            onChange={(e) => setSessionDate(e.target.value)}
            required
            className="w-full rounded-lg border border-explore-charcoal/20 px-4 py-2"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-explore-charcoal/70">Explanation</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            required
            rows={3}
            placeholder="Describe the absence or reason for excusal..."
            className="w-full rounded-lg border border-explore-charcoal/20 px-4 py-2"
          />
        </div>
        <div className="sm:col-span-2">
          <span className="mb-2 block text-sm font-medium text-explore-charcoal/70">
            Doctor&apos;s note or attachment <span className="font-normal text-explore-charcoal/50">(optional)</span>
          </span>
          {attachment ? (
            <div className="flex items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2 text-sm text-explore-charcoal">
                <Paperclip className="h-4 w-4 shrink-0 text-explore-teal" />
                <span className="truncate font-medium">{attachment.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="shrink-0 rounded p-1 text-explore-charcoal/50 hover:bg-white hover:text-explore-charcoal"
                aria-label="Remove attachment"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
              }}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setDragOver(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                pickFile(e.dataTransfer.files?.[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors",
                dragOver
                  ? "border-explore-teal bg-explore-teal/5"
                  : "border-explore-charcoal/25 bg-explore-cream/40 hover:border-explore-teal/50 hover:bg-explore-cream/70"
              )}
            >
              <Upload className="h-8 w-8 text-explore-teal/70" aria-hidden />
              <p className="mt-2 text-sm font-semibold text-explore-charcoal">
                Upload doctor&apos;s note here
              </p>
              <p className="mt-1 text-xs text-explore-charcoal/60">
                Drag & drop a file, or{" "}
                <label
                  htmlFor={fileInputId}
                  onClick={(e) => e.stopPropagation()}
                  className="cursor-pointer font-semibold text-explore-teal hover:underline"
                >
                  browse
                </label>
              </p>
              <p className="mt-2 text-xs text-explore-charcoal/45">PDF or image · up to 10 MB</p>
              <input
                id={fileInputId}
                ref={fileInputRef}
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,image/*,application/pdf"
                onChange={(e) => pickFile(e.target.files?.[0])}
                className="hidden"
              />
            </div>
          )}
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      {message && <p className="text-sm text-green-700">{message}</p>}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-lg bg-explore-sand px-4 py-2 text-sm font-semibold text-explore-charcoal hover:bg-explore-sand/80 disabled:opacity-50"
      >
        {loading && <Loader className="h-4 w-4 animate-spin" />}
        Submit Excuse Note
      </button>
    </form>
  );
}
