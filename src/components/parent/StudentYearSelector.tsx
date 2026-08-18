"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { getSchoolYearOptions } from "@/lib/portfolio/constants";

interface StudentOption {
  id: string;
  name: string;
}

export function StudentYearSelector({
  students,
  selectedStudentId,
  selectedYear,
  hideYear = false,
  showAllOption = false,
}: {
  students: StudentOption[];
  selectedStudentId?: string;
  selectedYear?: string;
  hideYear?: boolean;
  showAllOption?: boolean;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const years = getSchoolYearOptions();
  const studentId = selectedStudentId ?? (showAllOption ? "all" : students[0]?.id ?? "");
  const year = selectedYear ?? years[0];

  function update(key: "student" | "year", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" && key === "student") {
      params.delete("student");
    } else {
      params.set(key, value);
    }
    router.push(`?${params.toString()}`);
  }

  if (students.length === 0) return null;

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-xl border border-explore-charcoal/10 bg-white p-4 shadow-sm">
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-explore-charcoal/50">
          {showAllOption ? "Switch Student" : "Student"}
        </label>
        <select
          value={studentId}
          onChange={(e) => update("student", e.target.value)}
          className="mt-1 rounded-lg border border-explore-charcoal/15 px-3 py-2 text-sm"
        >
          {showAllOption && <option value="all">All Children</option>}
          {students.map((s) => (
            <option key={s.id} value={s.id}>{s.name}</option>
          ))}
        </select>
      </div>
      {!hideYear && (
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wide text-explore-charcoal/50">
            School Year
          </label>
          <select
            value={year}
            onChange={(e) => update("year", e.target.value)}
            className="mt-1 rounded-lg border border-explore-charcoal/15 px-3 py-2 text-sm"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
