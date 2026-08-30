import { serializeAdmin, toAdminRecord, type AdminRecord } from "@/lib/admin/serialize";

/** Format a date for an HTML date input without throwing on bad values. */
export function toDateInputValue(value: unknown): string {
  if (!value) return "";
  const date = new Date(value as string | Date);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

/** Merge User + StudentProfile for StudentForm without clobbering the user _id. */
export function buildStudentFormInitialData(
  user: Record<string, unknown>,
  profile: Record<string, unknown> | null | undefined
): AdminRecord {
  const serializedUser = serializeAdmin(user) as Record<string, unknown>;

  if (!profile) {
    return toAdminRecord(serializedUser);
  }

  const serializedProfile = serializeAdmin(profile) as Record<string, unknown>;

  return toAdminRecord({
    ...serializedUser,
    dateOfBirth: serializedProfile.dateOfBirth,
    schoolStatus: serializedProfile.schoolStatus,
    bio: serializedProfile.bio,
    grade: serializedProfile.grade,
    ageRange: serializedProfile.ageRange,
  });
}
