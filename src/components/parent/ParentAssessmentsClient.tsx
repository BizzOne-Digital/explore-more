"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Download } from "lucide-react";
import { formatGradeLabel } from "@/lib/grades";
import { getAssessmentFileUrl } from "@/lib/assessments/display";

export interface ParentAssessmentItem {
  assessmentId: string;
  title: string;
  grade: string;
  filePath: string;
  studentId: string;
  studentName: string;
  submission: {
    _id: string;
    filePath: string;
    submittedAt: string;
    letterGrade?: string;
    published: boolean;
    publishedAt?: string;
  } | null;
}

export function ParentAssessmentsClient({ items }: { items: ParentAssessmentItem[] }) {
  const router = useRouter();
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const pending = items.filter((i) => !i.submission);
  const submitted = items.filter((i) => i.submission && !i.submission.published);
  const published = items.filter((i) => i.submission?.published);

  async function handleResubmit(item: ParentAssessmentItem, file: File) {
    const key = `${item.assessmentId}:${item.studentId}`;
    setError(null);
    setMessage(null);
    setUploadingKey(key);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const uploadRes = await fetch("/api/parent/assessments/upload", {
        method: "POST",
        body: formData,
      });
      const uploadJson = await uploadRes.json();
      if (!uploadJson.success) {
        setError(uploadJson.error ?? "Upload failed");
        return;
      }

      setSubmittingKey(key);
      const res = await fetch("/api/parent/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentId: item.assessmentId,
          studentId: item.studentId,
          filePath: uploadJson.data.path,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Resubmission failed");
        return;
      }

      setMessage("Assessment resubmitted successfully.");
      router.refresh();
    } catch {
      setError("Resubmission failed");
    } finally {
      setUploadingKey(null);
      setSubmittingKey(null);
    }
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          {message}
        </div>
      )}

      <Section title="Pending — Resubmit Required" empty="No pending assessments." count={pending.length}>
        {pending.map((item) => (
          <AssessmentCard
            key={`${item.assessmentId}-${item.studentId}`}
            item={item}
            uploading={uploadingKey === `${item.assessmentId}:${item.studentId}`}
            submitting={submittingKey === `${item.assessmentId}:${item.studentId}`}
            onResubmit={(file) => handleResubmit(item, file)}
          />
        ))}
      </Section>

      <Section title="Submitted — Awaiting Grade" empty="No assessments awaiting grading." count={submitted.length}>
        {submitted.map((item) => (
          <AssessmentCard key={`${item.assessmentId}-${item.studentId}`} item={item} readOnly />
        ))}
      </Section>

      <Section title="Published Results" empty="No published results yet." count={published.length}>
        {published.map((item) => (
          <AssessmentCard key={`${item.assessmentId}-${item.studentId}`} item={item} readOnly showGrade />
        ))}
      </Section>
    </div>
  );
}

function Section({
  title,
  empty,
  count,
  children,
}: {
  title: string;
  empty: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="font-display text-lg text-explore-charcoal">{title}</h3>
      {count === 0 ? (
        <p className="mt-2 text-sm text-explore-charcoal/60">{empty}</p>
      ) : (
        <div className="mt-4 grid gap-4">{children}</div>
      )}
    </section>
  );
}

function AssessmentCard({
  item,
  onResubmit,
  uploading,
  submitting,
  readOnly,
  showGrade,
}: {
  item: ParentAssessmentItem;
  onResubmit?: (file: File) => void;
  uploading?: boolean;
  submitting?: boolean;
  readOnly?: boolean;
  showGrade?: boolean;
}) {
  return (
    <article className="rounded-2xl border border-explore-sand bg-explore-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-explore-teal">
            {formatGradeLabel(item.grade)}
          </p>
          <h4 className="mt-1 font-display text-lg text-explore-charcoal">{item.title}</h4>
          <p className="mt-1 text-sm text-explore-charcoal/60">Student: {item.studentName}</p>
          {showGrade && item.submission?.letterGrade && (
            <p className="mt-3 text-2xl font-bold text-explore-teal">{item.submission.letterGrade}</p>
          )}
          {item.submission && !showGrade && (
            <p className="mt-2 text-xs text-explore-charcoal/50">
              Resubmitted {new Date(item.submission.submittedAt).toLocaleDateString()}
            </p>
          )}
        </div>
        <a
          href={getAssessmentFileUrl(item.filePath)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-explore-charcoal/15 px-3 py-2 text-sm font-medium text-explore-charcoal hover:bg-explore-sand"
        >
          <Download className="h-4 w-4" />
          Download
        </a>
      </div>

      {!readOnly && onResubmit && (
        <div className="mt-4 border-t border-explore-sand pt-4">
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-explore-sand bg-explore-cream px-4 py-6 transition hover:border-explore-teal/40">
            <Upload className="mb-2 h-6 w-6 text-explore-charcoal/40" />
            <span className="text-sm text-explore-charcoal/60">
              {uploading || submitting ? "Uploading…" : "Upload completed PDF to resubmit"}
            </span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              disabled={uploading || submitting}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onResubmit(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>
      )}

      {item.submission?.filePath && readOnly && !showGrade && (
        <div className="mt-3 flex items-center gap-2 text-sm text-explore-charcoal/70">
          <FileText className="h-4 w-4" />
          <a
            href={getAssessmentFileUrl(item.submission.filePath)}
            target="_blank"
            rel="noopener noreferrer"
            className="text-explore-teal hover:underline"
          >
            View your resubmission
          </a>
        </div>
      )}
    </article>
  );
}
