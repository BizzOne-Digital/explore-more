"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export function CopyIdButton({
  value,
  label = "Copy ID",
  variant = "light",
}: {
  value: string;
  label?: string;
  variant?: "light" | "dark";
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  const styles =
    variant === "dark"
      ? "border-white/30 bg-white/10 text-white hover:bg-white/20"
      : "border-explore-charcoal/15 bg-explore-sand text-explore-charcoal hover:bg-explore-sand/80";

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${styles}`}
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? "Copied!" : label}
    </button>
  );
}
