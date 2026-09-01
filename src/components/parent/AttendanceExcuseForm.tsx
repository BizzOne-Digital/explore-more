"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader, Paperclip, X } from "lucide-react";

export function AttendanceExcuseForm({ studentId }: { studentId: string }) {
  const router = useRouter();
  const [sessionDate, setSessionDate] = useState("");
  const [note, setNote] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

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
          <label className="mb-1 block text-sm font-medium text-explore-charcoal/70">
            Doctor&apos;s note or attachment <span className="font-normal text-explore-charcoal/50">(optional)</span>
          </label>
          {attachment ? (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-explore-charcoal/20 px-4 py-2">
              <div className="flex min-w-0 items-center gap-2 text-sm text-explore-charcoal">
                <Paperclip className="h-4 w-4 shrink-0 text-explore-teal" />
                <span className="truncate">{attachment.name}</span>
              </div>
              <button
                type="button"
                onClick={() => setAttachment(null)}
                className="shrink-0 rounded p-1 text-explore-charcoal/50 hover:bg-explore-cream hover:text-explore-charcoal"
                aria-label="Remove attachment"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,image/*,application/pdf"
              onChange={(e) => setAttachment(e.target.files?.[0] ?? null)}
              className="w-full text-sm"
            />
          )}
          <p className="mt-1 text-xs text-explore-charcoal/50">PDF or image, up to 10 MB</p>
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
