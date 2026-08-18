/** 6-digit numeric student IDs (000000–999999). */
export const STUDENT_ID_LENGTH = 6;

export function formatStudentId(value: number): string {
  const clamped = Math.max(0, Math.min(999999, Math.floor(value)));
  return String(clamped).padStart(STUDENT_ID_LENGTH, "0");
}

export function randomStudentIdCandidate(): string {
  return formatStudentId(Math.floor(Math.random() * 1_000_000));
}

export function isValidStudentIdFormat(value: string): boolean {
  return /^\d{1,6}$/.test(value.trim());
}

export function normalizeStudentIdInput(value: string): string {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return trimmed;
  return formatStudentId(Number(trimmed));
}
