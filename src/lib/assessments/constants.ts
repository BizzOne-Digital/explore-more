export const LETTER_GRADES = [
  "A+",
  "A",
  "B+",
  "B",
  "C+",
  "C",
  "D+",
  "D",
  "F",
] as const;

export type LetterGrade = (typeof LETTER_GRADES)[number];

export const MAX_ASSESSMENT_PDF_SIZE = 30 * 1024 * 1024;

export function isLetterGrade(value: string): value is LetterGrade {
  return (LETTER_GRADES as readonly string[]).includes(value);
}

export function letterGradeOptions(): Array<{ value: string; label: string }> {
  return [{ value: "", label: "Select grade..." }, ...LETTER_GRADES.map((g) => ({ value: g, label: g }))];
}
