/** 6-digit numeric student IDs (100000–999999, easy to read and remember). */
export const STUDENT_ID_LENGTH = 6;
export const STUDENT_ID_MIN = 100_000;
export const STUDENT_ID_MAX = 999_999;

export function formatStudentId(value: number): string {
  const clamped = Math.max(STUDENT_ID_MIN, Math.min(STUDENT_ID_MAX, Math.floor(value)));
  return String(clamped).padStart(STUDENT_ID_LENGTH, "0");
}

export function randomStudentIdCandidate(): string {
  return formatStudentId(
    STUDENT_ID_MIN + Math.floor(Math.random() * (STUDENT_ID_MAX - STUDENT_ID_MIN + 1))
  );
}

/** Accepts 1–6 digits; normalized to 6-digit zero-padded form for lookup. */
export function isValidStudentIdFormat(value: string): boolean {
  return /^\d{1,6}$/.test(value.trim());
}

export function isSixDigitStudentId(value: string | null | undefined): boolean {
  return typeof value === "string" && /^\d{6}$/.test(value) && Number(value) >= STUDENT_ID_MIN;
}

export function normalizeStudentIdInput(value: string): string {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return trimmed;
  const numeric = Number(trimmed);
  if (numeric < STUDENT_ID_MIN || numeric > STUDENT_ID_MAX) return trimmed;
  return formatStudentId(numeric);
}

export function isLegacyStudentId(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;
  return !isSixDigitStudentId(value);
}
