"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PORTFOLIO_STATUS_LABELS } from "@/lib/portfolio/constants";

export function PortfolioReviewsManager() {
  const router = useRouter();
  const [portfolios, setPortfolios] = useState<Array<{
    _id: string;
    schoolYear: string;
    status: keyof typeof PORTFOLIO_STATUS_LABELS;
    studentId?: { name?: string };
    guardianId?: { name?: string };
    submittedAt?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/portfolios")
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setPortfolios(json.data ?? []);
        setLoading(false);
      });
  }, []);

  async function updatePortfolio(portfolioId: string, status: string, reviewRequest?: { subject?: string; message: string }) {
    await fetch("/api/admin/portfolios", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ portfolioId, status, reviewRequest }),
    });
    router.refresh();
    const res = await fetch("/api/admin/portfolios");
    const json = await res.json();
    if (json.success) setPortfolios(json.data ?? []);
  }

  if (loading) return <p className="text-sm text-white/50">Loading portfolios…</p>;

  return (
    <div className="space-y-3">
      {portfolios.map((p) => (
        <div key={p._id} className="rounded-lg border border-white/10 bg-white/5 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="font-medium text-white">{p.studentId?.name ?? "Student"} — {p.schoolYear}</p>
              <p className="text-sm text-white/50">Guardian: {p.guardianId?.name ?? "—"}</p>
              <p className="text-sm text-explore-lime">{PORTFOLIO_STATUS_LABELS[p.status]}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => updatePortfolio(p._id, "under_review")} className="rounded bg-white/10 px-3 py-1 text-xs text-white">Under Review</button>
              <button type="button" onClick={() => updatePortfolio(p._id, "completed")} className="rounded bg-explore-teal px-3 py-1 text-xs text-white">Mark Completed</button>
              <button
                type="button"
                onClick={() => {
                  const message = prompt("Request message for parent:");
                  if (message) updatePortfolio(p._id, "additional_docs_requested", { subject: "General", message });
                }}
                className="rounded bg-explore-orange px-3 py-1 text-xs text-white"
              >
                Request Docs
              </button>
            </div>
          </div>
        </div>
      ))}
      {portfolios.length === 0 && <p className="text-sm text-white/50">No submitted portfolios yet.</p>}
    </div>
  );
}
