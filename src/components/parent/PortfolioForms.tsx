"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PORTFOLIO_SUBJECTS,
  PROGRESS_MARKERS,
  PROGRESS_MARKER_LABELS,
} from "@/lib/portfolio/constants";

export function WorkSampleForm({
  studentId,
  schoolYear,
}: {
  studentId: string;
  schoolYear: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("studentId", studentId);
    formData.set("schoolYear", schoolYear);

    try {
      const res = await fetch("/api/parent/portfolio/work-samples", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Upload failed");
      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm border border-explore-charcoal/8">
      <h3 className="font-display text-lg font-bold text-explore-charcoal">Upload Work Sample</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Subject">
          <select name="subject" required className={inputClass}>
            {PORTFOLIO_SUBJECTS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </Field>
        <Field label="Assignment Name">
          <input name="assignmentName" required className={inputClass} placeholder="Chapter 5 Math Quiz" />
        </Field>
        <Field label="Date Completed">
          <input name="dateCompleted" type="date" required className={inputClass} />
        </Field>
        <Field label="Progress Marker">
          <select name="progressMarker" className={inputClass}>
            {PROGRESS_MARKERS.map((m) => (
              <option key={m} value={m}>{PROGRESS_MARKER_LABELS[m]}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Description / Notes">
        <textarea name="description" rows={3} className={inputClass} />
      </Field>

      <Field label="Files (PDF, images, documents — drag & drop supported)">
        <input name="files" type="file" multiple className={inputClass} />
      </Field>

      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-explore-teal px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? "Uploading…" : "Upload Work Sample"}
      </button>
    </form>
  );
}

export function ReadingEntryForm({ studentId, schoolYear }: { studentId: string; schoolYear: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    try {
      const res = await fetch("/api/parent/portfolio/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, studentId, schoolYear }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm border border-explore-charcoal/8">
      <h3 className="font-display text-lg font-bold">Add Reading / Resource</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Book / Resource Title"><input name="bookTitle" required className={inputClass} /></Field>
        <Field label="Author"><input name="author" className={inputClass} /></Field>
        <Field label="Subject"><input name="subject" className={inputClass} placeholder="Language Arts" /></Field>
        <Field label="Type">
          <select name="resourceType" className={inputClass}>
            <option value="book">Book</option>
            <option value="textbook">Textbook</option>
            <option value="online_program">Online Program</option>
            <option value="audiobook">Audiobook</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Date Started"><input name="dateStarted" type="date" className={inputClass} /></Field>
        <Field label="Date Completed"><input name="dateCompleted" type="date" className={inputClass} /></Field>
      </div>
      <Field label="Notes"><textarea name="notes" rows={2} className={inputClass} /></Field>
      <button type="submit" disabled={loading} className="rounded-lg bg-explore-teal px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
        {loading ? "Saving…" : "Add Another Book"}
      </button>
    </form>
  );
}

export function ActivityForm({ studentId, schoolYear }: { studentId: string; schoolYear: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("studentId", studentId);
    formData.set("schoolYear", schoolYear);

    try {
      const res = await fetch("/api/parent/portfolio/activities", { method: "POST", body: formData });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      form.reset();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm border border-explore-charcoal/8">
      <h3 className="font-display text-lg font-bold">Log Activity</h3>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category">
          <select name="category" required className={inputClass}>
            {["Field Trips", "Science Experiments", "Museum Visits", "Nature Studies", "Community Service", "Educational Events", "Art Projects", "STEM Projects", "Physical Education", "Music", "Educational Travel", "Library Visits", "Clubs/Co-ops", "Other Activities"].map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>
        <Field label="Activity Name"><input name="activityName" required className={inputClass} /></Field>
        <Field label="Date"><input name="date" type="date" required className={inputClass} /></Field>
        <Field label="Hours"><input name="hours" type="number" step="0.5" min="0" className={inputClass} /></Field>
        <Field label="Subject"><input name="subject" className={inputClass} /></Field>
        <Field label="Location"><input name="location" className={inputClass} /></Field>
      </div>
      <Field label="What the Student Learned"><textarea name="learned" rows={3} className={inputClass} /></Field>
      <Field label="Photos / Documentation"><input name="files" type="file" multiple className={inputClass} /></Field>
      <button type="submit" disabled={loading} className="rounded-lg bg-explore-teal px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
        {loading ? "Saving…" : "Log Activity"}
      </button>
    </form>
  );
}

export function AttendanceForm({ studentId, schoolYear }: { studentId: string; schoolYear: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const data = Object.fromEntries(new FormData(form));

    await fetch("/api/parent/portfolio/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, studentId, schoolYear }),
    });
    form.reset();
    router.refresh();
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm border border-explore-charcoal/8">
      <h3 className="font-display text-lg font-bold">Record Attendance</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date"><input name="date" type="date" required className={inputClass} /></Field>
        <Field label="Type">
          <select name="type" required className={inputClass}>
            <option value="instruction">Instruction Day</option>
            <option value="present">Present</option>
            <option value="field_trip">Field Trip</option>
            <option value="educational_activity">Educational Activity</option>
            <option value="holiday">Holiday / Break</option>
          </select>
        </Field>
      </div>
      <Field label="Notes"><input name="notes" className={inputClass} /></Field>
      <button type="submit" disabled={loading} className="rounded-lg bg-explore-teal px-5 py-2.5 text-sm font-semibold text-white">
        Save Attendance
      </button>
    </form>
  );
}

export function CurriculumForm({ studentId, schoolYear }: { studentId: string; schoolYear: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    formData.set("studentId", studentId);
    formData.set("schoolYear", schoolYear);
    await fetch("/api/parent/portfolio/curriculum", { method: "POST", body: formData });
    form.reset();
    router.refresh();
    setLoading(false);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-2xl bg-white p-6 shadow-sm border border-explore-charcoal/8">
      <h3 className="font-display text-lg font-bold">Curriculum & Educational Materials</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Subject">
          <select name="subject" required className={inputClass}>
            {PORTFOLIO_SUBJECTS.map((s) => (<option key={s} value={s}>{s}</option>))}
          </select>
        </Field>
        <Field label="Material / Curriculum"><input name="materialName" required className={inputClass} placeholder="Teaching Textbooks Grade 4" /></Field>
      </div>
      <Field label="Description"><textarea name="description" rows={2} className={inputClass} /></Field>
      <Field label="Supporting Files"><input name="files" type="file" multiple className={inputClass} /></Field>
      <button type="submit" disabled={loading} className="rounded-lg bg-explore-teal px-5 py-2.5 text-sm font-semibold text-white">
        Add Curriculum
      </button>
    </form>
  );
}

export function SubmitPortfolioButton({
  portfolioId,
  canSubmit,
}: {
  portfolioId: string;
  canSubmit: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function submit() {
    if (!canSubmit) {
      setMessage("Complete more portfolio sections before submitting.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/parent/portfolio/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portfolioId }),
    });
    const json = await res.json();
    setMessage(json.success ? "Portfolio submitted for review!" : json.error);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border-2 border-explore-orange/30 bg-explore-orange/5 p-6 text-center">
      <h3 className="font-display text-xl font-bold text-explore-charcoal">Submit Portfolio for Review</h3>
      <p className="mt-2 text-sm text-explore-charcoal/70">
        When everything is ready, submit your homeschool portfolio to Explore More Academy for review.
      </p>
      {message && <p className="mt-3 text-sm text-explore-teal">{message}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={loading}
        className="mt-4 rounded-lg bg-explore-orange px-8 py-3 text-sm font-bold uppercase tracking-wide text-white disabled:opacity-50"
      >
        {loading ? "Submitting…" : "Submit Portfolio for Review"}
      </button>
    </div>
  );
}

export function ExportPortfolioForm({
  portfolioId,
  studentName,
  schoolYear,
}: {
  portfolioId: string;
  studentName: string;
  schoolYear: string;
}) {
  const [loading, setLoading] = useState(false);
  const safeName = studentName.replace(/[^\w.-]+/g, "_");

  async function exportZip() {
    setLoading(true);
    const res = await fetch("/api/parent/portfolio/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portfolioId }),
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `portfolio-${schoolYear.replace(/[^\d-]/g, "")}-${safeName}.zip`;
    a.click();
    URL.revokeObjectURL(url);
    setLoading(false);
  }

  async function exportPdf() {
    setLoading(true);
    try {
      const res = await fetch(`/api/parent/portfolio/export/pdf?portfolioId=${portfolioId}`);
      if (!res.ok) throw new Error("PDF export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `portfolio-${schoolYear.replace(/[^\d-]/g, "")}-${safeName}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Could not generate portfolio PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-explore-charcoal/8 space-y-4">
      <div>
        <h3 className="font-display text-lg font-bold">Export My Homeschool Portfolio</h3>
        <p className="mt-2 text-sm text-explore-charcoal/70">
          Download a professionally formatted PDF summary of all portfolio records, or export the
          complete archive with original uploaded files.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={exportPdf}
          disabled={loading}
          className="rounded-lg bg-explore-teal px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Preparing…" : "Download Portfolio Summary (PDF)"}
        </button>
        <button
          type="button"
          onClick={exportZip}
          disabled={loading}
          className="rounded-lg bg-explore-forest px-6 py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {loading ? "Preparing…" : "Download Complete Archive (ZIP)"}
        </button>
      </div>
      <p className="text-xs text-explore-charcoal/50">
        The ZIP archive includes Portfolio-Summary.pdf plus all original work samples, curriculum,
        and activity files.
      </p>
    </div>
  );
}

const inputClass = "mt-1 w-full rounded-lg border border-explore-charcoal/15 px-3 py-2 text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="font-medium text-explore-charcoal">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
