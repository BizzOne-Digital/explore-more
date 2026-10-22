"use client";

export function LessonPlanPrintActions() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white print:hidden"
    >
      Print
    </button>
  );
}
