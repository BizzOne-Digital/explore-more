"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export function TutorPortalBackButton({ role }: { role: string }) {
  const router = useRouter();

  function handleBack() {
    if (typeof window === "undefined") return;

    const referrer = document.referrer;
    const sameOriginReferrer =
      referrer.startsWith(window.location.origin) &&
      referrer !== window.location.href &&
      !referrer.includes("/tutor");

    if (sameOriginReferrer) {
      router.back();
      return;
    }

    if (role === "administrator") {
      router.push("/admin");
      return;
    }

    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  }

  return (
    <button
      type="button"
      onClick={handleBack}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-semibold text-gray-600 transition hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700"
      aria-label="Go back to previous page"
    >
      <ArrowLeft className="h-4 w-4" />
      <span className="hidden sm:inline">Back</span>
    </button>
  );
}
