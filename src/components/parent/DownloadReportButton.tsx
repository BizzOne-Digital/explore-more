"use client";

import { useState } from "react";
import { Download } from "lucide-react";

type DownloadReportButtonProps = {
  href: string;
  label: string;
  filename?: string;
  variant?: "primary" | "secondary";
  className?: string;
};

export function DownloadReportButton({
  href,
  label,
  filename,
  variant = "primary",
  className = "",
}: DownloadReportButtonProps) {
  const [loading, setLoading] = useState(false);

  async function download() {
    setLoading(true);
    try {
      const res = await fetch(href);
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || json?.message || "Download failed");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename || "report.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(error instanceof Error ? error.message : "Download failed");
    } finally {
      setLoading(false);
    }
  }

  const baseClass =
    variant === "primary"
      ? "bg-explore-teal text-white"
      : "border border-explore-charcoal/15 bg-white text-explore-charcoal";

  return (
    <button
      type="button"
      onClick={download}
      disabled={loading}
      className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50 ${baseClass} ${className}`}
    >
      <Download className="h-4 w-4" />
      {loading ? "Preparing PDF…" : label}
    </button>
  );
}
