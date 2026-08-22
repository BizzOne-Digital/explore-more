/** School grade levels 1st–12th. */
export const GRADE_LEVELS = [
  "1st",
  "2nd",
  "3rd",
  "4th",
  "5th",
  "6th",
  "7th",
  "8th",
  "9th",
  "10th",
  "11th",
  "12th",
] as const;

export type GradeLevel = (typeof GRADE_LEVELS)[number];

export function isGradeLevel(value: string): value is GradeLevel {
  return (GRADE_LEVELS as readonly string[]).includes(value);
}

export function formatGradeLabel(grade: string): string {
  if (!grade) return "";
  return isGradeLevel(grade) ? `${grade} Grade` : grade;
}

export function gradeSelectOptions(includeEmpty = true): Array<{ value: string; label: string }> {
  const options = GRADE_LEVELS.map((g) => ({ value: g, label: formatGradeLabel(g) }));
  return includeEmpty ? [{ value: "", label: "Select grade..." }, ...options] : options;
}
