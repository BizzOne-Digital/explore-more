"use client";

import { useRouter } from "next/navigation";

interface StudentOption {
  id: string;
  name: string;
}

export function AttendanceFilters({
  students,
  selectedStudentId,
  monthParam,
  basePath = "/parent/attendance",
}: {
  students: StudentOption[];
  selectedStudentId?: string;
  monthParam: string;
  basePath?: string;
}) {
  const router = useRouter();

  function navigate(student?: string, month?: string) {
    const params = new URLSearchParams();
    if (student) params.set("student", student);
    if (month) params.set("month", month);
    router.push(`${basePath}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-4 rounded-xl bg-white p-4 shadow-sm">
      {students.length > 0 && (
        <div className="min-w-[200px] flex-1">
          <label htmlFor="student-select" className="mb-2 block text-sm font-medium text-explore-charcoal/70">
            Select Student
          </label>
          <select
            id="student-select"
            value={selectedStudentId ?? ""}
            onChange={(e) => navigate(e.target.value, monthParam)}
            className="w-full rounded-lg border border-explore-charcoal/20 bg-white px-4 py-2 text-explore-charcoal"
          >
            {students.map((student) => (
              <option key={student.id} value={student.id}>
                {student.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="min-w-[200px] flex-1">
        <label htmlFor="month-select" className="mb-2 block text-sm font-medium text-explore-charcoal/70">
          Select Month
        </label>
        <input
          id="month-select"
          type="month"
          value={monthParam}
          onChange={(e) => navigate(selectedStudentId, e.target.value)}
          className="w-full rounded-lg border border-explore-charcoal/20 bg-white px-4 py-2 text-explore-charcoal"
        />
      </div>
    </div>
  );
}
