"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewRequestResponder({
  requestId,
  subject,
  message,
}: {
  requestId: string;
  subject?: string;
  message: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    formData.set("requestId", requestId);
    await fetch("/api/parent/portfolio/review-requests", { method: "PATCH", body: formData });
    router.refresh();
    setLoading(false);
  }

  return (
    <div className="rounded-xl border border-explore-orange/30 bg-explore-orange/5 p-5">
      <p className="text-xs font-semibold uppercase text-explore-orange">
        Additional Documentation Requested{subject ? ` — ${subject}` : ""}
      </p>
      <p className="mt-2 text-sm text-explore-charcoal/80">{message}</p>
      <form onSubmit={onSubmit} className="mt-4 space-y-3">
        <textarea name="responseNote" rows={2} placeholder="Optional note" className="w-full rounded-lg border px-3 py-2 text-sm" />
        <input name="files" type="file" multiple className="text-sm" />
        <button type="submit" disabled={loading} className="rounded-lg bg-explore-orange px-4 py-2 text-sm font-semibold text-white">
          Upload Requested Documents
        </button>
      </form>
    </div>
  );
}
