import connectDB from "@/lib/db";
import { User } from "@/models";
import type { IUser } from "@/models/User";
import { normalizeStudentIdInput } from "@/lib/students/id-codegen";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Resolve a user from email or role-specific ID (Student ID, Guardian ID, Staff ID, Tutor ID). */
export async function findUserByLoginIdentifier(identifier: string): Promise<IUser | null> {
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  await connectDB();

  if (trimmed.includes("@")) {
    return User.findOne({ email: trimmed.toLowerCase() });
  }

  const exactCi = new RegExp(`^${escapeRegex(trimmed)}$`, "i");
  const orConditions: Record<string, unknown>[] = [
    { guardianId: exactCi },
    { staffId: exactCi },
    { tutorId: exactCi },
    { studentId: trimmed },
  ];

  if (/^\d+$/.test(trimmed)) {
    orConditions.push({ studentId: normalizeStudentIdInput(trimmed) });
  }

  const byId = await User.findOne({ $or: orConditions });
  if (byId) return byId;

  return User.findOne({ email: trimmed.toLowerCase() });
}
