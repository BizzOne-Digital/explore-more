/** Letter grade and GPA helpers for the public transcript generator. */

const LETTER_GRADES: Array<{ min: number; letter: string; gpa: number }> = [
  { min: 97, letter: "A+", gpa: 4.0 },
  { min: 93, letter: "A", gpa: 4.0 },
  { min: 90, letter: "A-", gpa: 3.7 },
  { min: 87, letter: "B+", gpa: 3.3 },
  { min: 83, letter: "B", gpa: 3.0 },
  { min: 80, letter: "B-", gpa: 2.7 },
  { min: 77, letter: "C+", gpa: 2.3 },
  { min: 73, letter: "C", gpa: 2.0 },
  { min: 70, letter: "C-", gpa: 1.7 },
  { min: 67, letter: "D+", gpa: 1.3 },
  { min: 63, letter: "D", gpa: 1.0 },
  { min: 60, letter: "D-", gpa: 0.7 },
  { min: 0, letter: "F", gpa: 0.0 },
];

export function percentToLetter(percent: number): string {
  if (Number.isNaN(percent)) return "";
  const clamped = Math.max(0, Math.min(100, percent));
  return LETTER_GRADES.find((g) => clamped >= g.min)?.letter ?? "F";
}

export function letterToGpa(letter: string): number {
  const normalized = letter.trim().toUpperCase();
  const match = LETTER_GRADES.find((g) => g.letter === normalized);
  if (match) return match.gpa;
  const base = normalized.charAt(0);
  if (base === "A") return 4.0;
  if (base === "B") return 3.0;
  if (base === "C") return 2.0;
  if (base === "D") return 1.0;
  return 0.0;
}

export type TranscriptCourseInput = {
  courseName: string;
  gradePercent: string;
  letterGrade: string;
  startDate: string;
  endDate: string;
  duration: string;
  credits: string;
};

export function computeCourseDuration(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return "";
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) return "";

  const months =
    (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
  if (months >= 10) return "Full year";
  if (months >= 5) return "Semester";
  if (months >= 2) return `${months} months`;
  const days = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return days > 0 ? `${days} days` : "";
}

export function suggestCredits(duration: string): string {
  const trimmed = duration.trim();
  if (!trimmed) return "";

  const lower = trimmed.toLowerCase();
  if (lower.includes("full year") || lower === "year" || lower === "yr" || lower === "annual") {
    return "1.0";
  }
  if (lower.includes("semester") || lower.includes("half")) return "0.5";

  const num = parseFloat(trimmed);
  if (!Number.isNaN(num) && num > 0) {
    return Number.isInteger(num) ? num.toFixed(1) : String(num);
  }

  return "";
}

/** Resolve credits from the credits field, or infer from duration (e.g. "1" = 1.0 credit). */
export function resolveCourseCredits(course: TranscriptCourseInput): number {
  const explicit = parseFloat(course.credits.trim());
  if (!Number.isNaN(explicit) && explicit > 0) return explicit;

  const suggested = suggestCredits(course.duration);
  if (suggested) {
    const inferred = parseFloat(suggested);
    if (!Number.isNaN(inferred) && inferred > 0) return inferred;
  }

  return 0;
}

export function normalizeTranscriptCourse(course: TranscriptCourseInput): TranscriptCourseInput {
  const creditsValue = resolveCourseCredits(course);
  const percent = parseFloat(course.gradePercent);
  const letterGrade =
    course.letterGrade.trim() ||
    (Number.isNaN(percent) ? "" : percentToLetter(percent));

  return {
    ...course,
    letterGrade,
    credits: creditsValue > 0 ? creditsValue.toFixed(1) : course.credits,
  };
}

export function computeTranscriptTotals(courses: TranscriptCourseInput[]) {
  let totalCredits = 0;
  let weightedGpa = 0;
  let gpaCredits = 0;

  for (const course of courses) {
    if (!course.courseName.trim()) continue;

    const credits = resolveCourseCredits(course);
    if (credits <= 0) continue;

    totalCredits += credits;

    const percent = parseFloat(course.gradePercent);
    const letter =
      course.letterGrade.trim() ||
      (Number.isNaN(percent) ? "" : percentToLetter(percent));
    if (!letter) continue;

    const gpa = letterToGpa(letter);
    weightedGpa += gpa * credits;
    gpaCredits += credits;
  }

  const cumulativeGpa = gpaCredits > 0 ? weightedGpa / gpaCredits : 0;

  return {
    totalCredits: Math.round(totalCredits * 10) / 10,
    cumulativeGpa: Math.round(cumulativeGpa * 100) / 100,
  };
}

export const COMMON_COURSES = [
  "English Language Arts",
  "Mathematics",
  "Algebra I",
  "Geometry",
  "Algebra II",
  "Pre-Algebra",
  "Science",
  "Biology",
  "Chemistry",
  "Physics",
  "Earth Science",
  "Social Studies",
  "U.S. History",
  "World History",
  "Civics / Government",
  "Geography",
  "Art",
  "Music",
  "Physical Education",
  "Health",
  "Foreign Language",
  "Spanish",
  "French",
  "Computer Science",
  "Life Skills",
  "Elective",
] as const;

export const GRADE_LEVELS = [
  "Pre-K",
  "Kindergarten",
  "1st Grade",
  "2nd Grade",
  "3rd Grade",
  "4th Grade",
  "5th Grade",
  "6th Grade",
  "7th Grade",
  "8th Grade",
  "9th Grade",
  "10th Grade",
  "11th Grade",
  "12th Grade",
] as const;
