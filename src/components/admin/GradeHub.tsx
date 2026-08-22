import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { GRADE_LEVELS, formatGradeLabel } from "@/lib/grades";

interface GradeHubProps {
  title: string;
  description?: string;
  basePath: string;
}

export function GradeHub({ title, description, basePath }: GradeHubProps) {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
        {description && <p className="mt-1 text-sm text-white/60">{description}</p>}
        <p className="mt-2 text-sm text-white/50">Select a grade to continue</p>
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
