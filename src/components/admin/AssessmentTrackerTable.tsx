"use client";

import Link from "next/link";
import { formatDate } from "@/lib/admin/serialize";
import { getAssessmentFileUrl } from "@/lib/assessments/display";

export interface TrackerRow {
  parentId: string;
  parentName: string;
  parentEmail: string;
  studentId: string;
  studentName: string;
  resubmitted: boolean;
  submittedAt?: string;
  submissionFilePath?: string;
  published: boolean;
  letterGrade?: string;
}

export function AssessmentTrackerTable({ rows }: { rows: TrackerRow[] }) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/10">
      <table className="w-full text-left text-sm">
        <thead className="bg-white/5 text-white/60">
          <tr>
            <th className="px-4 py-3 font-medium">Parent</th>
            <th className="px-4 py-3 font-medium">Student</th>
            <th className="px-4 py-3 font-medium">Resubmitted</th>
            <th className="px-4 py-3 font-medium">Submitted</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="px-4 py-8 text-center text-white/50">
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
                    <span className="rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-300">
                      Resubmitted
                    </span>
                  ) : (
                    <span className="text-white/40">Pending</span>
                  )}
                </td>
                <td className="px-4 py-3 text-white/70">
                  {row.submittedAt ? (
                    <div className="space-y-1">
                      <p>{formatDate(row.submittedAt)}</p>
                      {row.submissionFilePath && (
                        <a
                          href={getAssessmentFileUrl(row.submissionFilePath)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-explore-teal hover:underline"
                        >
                          View PDF
                        </a>
                      )}
                    </div>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
