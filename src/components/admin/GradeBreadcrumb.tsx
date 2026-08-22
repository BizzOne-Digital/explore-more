import Link from "next/link";
import { formatGradeLabel, isGradeLevel } from "@/lib/grades";

interface GradeBreadcrumbProps {
  basePath: string;
  grade: string;
  segments?: Array<{ label: string; href?: string }>;
}

export function GradeBreadcrumb({ basePath, grade, segments = [] }: GradeBreadcrumbProps) {
  const gradeLabel = isGradeLevel(grade) ? formatGradeLabel(grade) : grade;

  return (
    <nav className="mb-6 flex flex-wrap items-center gap-2 text-sm text-white/60">
      <Link href={basePath} className="hover:text-white">
        All Grades
      </Link>
      <span>/</span>
      <Link href={`${basePath}?grade=${encodeURIComponent(grade)}`} className="hover:text-white">
        {gradeLabel}
      </Link>
      {segments.map((segment, index) => (
        <span key={`${segment.label}-${index}`} className="flex items-center gap-2">
          <span>/</span>
          {segment.href ? (
            <Link href={segment.href} className="hover:text-white">
              {segment.label}
            </Link>
          ) : (
            <span className="text-white">{segment.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
