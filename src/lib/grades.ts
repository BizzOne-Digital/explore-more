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

/** Stored on events/programs/courses published for every grade. */
export const ALL_GRADES_VALUE = "all" as const;

export function isGradeLevel(value: string): value is GradeLevel {
  return (GRADE_LEVELS as readonly string[]).includes(value);
}

export function isAllGrades(grade?: string | null): boolean {
  return grade === ALL_GRADES_VALUE;
}

export function isGradeOrAll(value: string): value is GradeLevel | typeof ALL_GRADES_VALUE {
  return isGradeLevel(value) || value === ALL_GRADES_VALUE;
}

export function formatGradeLabel(grade: string): string {
  if (!grade || isAllGrades(grade)) return "All Grades";
  return isGradeLevel(grade) ? `${grade} Grade` : grade;
}

/** Mongo filter: items for a specific grade plus all-grades items. */
export function gradeFilterForLevel(grade: GradeLevel) {
  return { $or: [{ grade }, { grade: ALL_GRADES_VALUE }] };
}

/** Whether content is visible for a student's grade. */
export function matchesStudentGrade(
  itemGrade: string | undefined | null,
  studentGrade: GradeLevel
): boolean {
  if (!itemGrade || isAllGrades(itemGrade)) return true;
  return itemGrade === studentGrade;
}

export function gradeSelectOptions(
  includeEmpty = true,
  includeAll = false
): Array<{ value: string; label: string }> {
  const options = GRADE_LEVELS.map((g) => ({ value: g, label: formatGradeLabel(g) }));
  const withAll = includeAll
    ? [{ value: ALL_GRADES_VALUE, label: formatGradeLabel(ALL_GRADES_VALUE) }, ...options]
    : options;
  return includeEmpty
    ? [{ value: "", label: "Select grade..." }, ...withAll]
    : withAll;
}
