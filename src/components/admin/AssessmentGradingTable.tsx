"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/admin/serialize";
import { getAssessmentFileUrl } from "@/lib/assessments/display";
import { LETTER_GRADES } from "@/lib/assessments/constants";

export interface GradingRow {
  parentId: string;
  parentName: string;
  parentEmail: string;
  studentId: string;
  studentName: string;
  resubmitted: boolean;
  submittedAt?: string;
  submissionId?: string;
  submissionFilePath?: string;
  letterGrade?: string;
  published: boolean;
}

interface Props {
  rows: GradingRow[];
}

export function AssessmentGradingTable({ rows }: Props) {
  const router = useRouter();
  const [grades, setGrades] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    for (const row of rows) {
      if (row.submissionId && row.letterGrade) {
        initial[row.submissionId] = row.letterGrade;
      }
    }
    return initial;
  });
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handlePublish(submissionId: string) {
    const letterGrade = grades[submissionId];
    if (!letterGrade) {
      setError("Please select a grade before publishing.");
      return;
    }

    setError(null);
    setLoadingId(submissionId);
    try {
      const res = await fetch(`/api/admin/assessments/submissions/${submissionId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ letterGrade, publish: true }),
      });
      const json = await res.json();
      if (!json.success) {
        setError(json.error ?? "Publish failed");
        return;
      }
      router.refresh();
    } catch {
      setError("Publish failed");
    } finally {
      setLoadingId(null);
    }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-white/10">
        <table className="w-full text-left text-sm">
          <thead className="bg-white/5 text-white/60">
            <tr>
              <th className="px-4 py-3 font-medium">Parent</th>
              <th className="px-4 py-3 font-medium">Student</th>
              <th className="px-4 py-3 font-medium">Resubmitted</th>
              <th className="px-4 py-3 font-medium">Submission</th>
              <th className="px-4 py-3 font-medium">Grade</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-white/50">
                  No linked parents found for this grade.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={`${row.parentId}-${row.studentId}`} className="border-t border-white/10">
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{row.parentName}</p>
                    <p className="text-xs text-white/50">{row.parentEmail}</p>
                  </td>
                  <td className="px-4 py-3 text-white/80">{row.studentName}</td>
                  <td className="px-4 py-3">
                    {row.resubmitted ? (
                      <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-300">
                        Resubmitted
                      </span>
                    ) : (
                      <span className="text-white/40">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-white/70">
                    {row.submissionFilePath ? (
                      <div className="space-y-1">
                        {row.submittedAt && <p className="text-xs">{formatDate(row.submittedAt)}</p>}
                        <a
                          href={getAssessmentFileUrl(row.submissionFilePath)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-explore-teal hover:underline"
                        >
                          Download PDF
                        </a>
                      </div>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.submissionId ? (
                      <select
                        value={grades[row.submissionId] ?? ""}
                        disabled={row.published}
                        onChange={(e) =>
                          setGrades((prev) => ({ ...prev, [row.submissionId!]: e.target.value }))
                        }
                        className="rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-white disabled:opacity-50"
                      >
                        <option value="" className="bg-explore-charcoal">
                          Select…
                        </option>
                        {LETTER_GRADES.map((g) => (
                          <option key={g} value={g} className="bg-explore-charcoal">
                            {g}
                          </option>
                        ))}
                      </select>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.published ? (
                      <span className="text-xs font-medium text-explore-teal">
                        Published {row.letterGrade ? `(${row.letterGrade})` : ""}
                      </span>
                    ) : row.resubmitted ? (
                      <span className="text-xs text-white/50">Pending review</span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {row.submissionId && !row.published && (
                      <button
                        type="button"
                        disabled={loadingId === row.submissionId}
                        onClick={() => handlePublish(row.submissionId!)}
                        className="rounded-lg bg-explore-lime px-3 py-1.5 text-xs font-semibold text-explore-black disabled:opacity-50"
                      >
                        {loadingId === row.submissionId ? "Publishing…" : "Publish"}
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
