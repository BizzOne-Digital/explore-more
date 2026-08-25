import Link from "next/link";
import { GraduationCap, Plus } from "lucide-react";
import { GRADE_LEVELS, formatGradeLabel } from "@/lib/grades";

interface GradeHubProps {
  title: string;
  description?: string;
  basePath: string;
  newAction?: { label: string; href: string };
}

export function GradeHub({ title, description, basePath, newAction }: GradeHubProps) {
  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
          {description && <p className="mt-1 text-sm text-white/60">{description}</p>}
          <p className="mt-2 text-sm text-white/50">Select a grade to continue</p>
        </div>
        {newAction && (
          <Link
            href={newAction.href}
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-explore-lime px-4 py-2 text-sm font-semibold text-explore-black transition hover:bg-explore-lime/90"
          >
            <Plus className="h-4 w-4" />
            {newAction.label}
          </Link>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {GRADE_LEVELS.map((grade) => (
          <Link
            key={grade}
            href={`${basePath}?grade=${encodeURIComponent(grade)}`}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-5 py-4 transition hover:border-explore-lime/40 hover:bg-white/10"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-explore-teal/20">
              <GraduationCap className="h-5 w-5 text-explore-teal" />
            </div>
            <span className="font-semibold text-white">{formatGradeLabel(grade)}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
