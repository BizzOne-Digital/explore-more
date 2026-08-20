import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { User } from "@/models";
import {
  normalizeStudentIdInput,
  randomStudentIdCandidate,
  isLegacyStudentId,
} from "@/lib/students/id-codegen";

export {
  formatStudentId,
  isValidStudentIdFormat,
  isSixDigitStudentId,
  isLegacyStudentId,
  normalizeStudentIdInput,
  STUDENT_ID_LENGTH,
  STUDENT_ID_MIN,
  STUDENT_ID_MAX,
} from "@/lib/students/id-codegen";

/** @deprecated Use generateUniqueStudentId() */
export function generateStudentId(): string {
  return randomStudentIdCandidate();
}

export async function generateUniqueStudentId(): Promise<string> {
  await connectDB();

  for (let attempt = 0; attempt < 50; attempt++) {
    const candidate = randomStudentIdCandidate();
    const exists = await User.exists({ studentId: candidate });
    if (!exists) return candidate;
  }

  throw new Error("Unable to generate a unique Student ID. Please try again.");
}

/** Assign or refresh 6-digit Student IDs for student accounts. */
export async function ensureAllStudentIds(): Promise<number> {
  await connectDB();
  const students = await User.find({ role: "student" }).select("_id studentId");

  let assigned = 0;
  for (const user of students) {
    if (!user.studentId || isLegacyStudentId(user.studentId)) {
      user.studentId = await generateUniqueStudentId();
      await user.save();
      assigned++;
    }
  }

  return assigned;
}

/** Ensure a single student has a 6-digit Student ID; returns the code. */
export async function ensureStudentUserId(userId: string): Promise<string | undefined> {
  await connectDB();
  const user = await User.findOne({ _id: userId, role: "student" });
  if (!user) return undefined;

  if (!user.studentId || isLegacyStudentId(user.studentId)) {
    user.studentId = await generateUniqueStudentId();
    await user.save();
  }

  return user.studentId;
}

/** Resolve a 6-digit Student ID or MongoDB _id to the student's user _id. */
export async function resolveStudentUserId(identifier: string): Promise<string | null> {
  await connectDB();
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  if (mongoose.Types.ObjectId.isValid(trimmed)) {
    const byObjectId = await User.findOne({ _id: trimmed, role: "student" }).select("_id").lean();
    if (byObjectId) return byObjectId._id.toString();
  }

  if (/^\d+$/.test(trimmed)) {
    const normalized = normalizeStudentIdInput(trimmed);
    const byCode = await User.findOne({
      role: "student",
      studentId: normalized,
    })
      .select("_id")
      .lean();
    if (byCode) return byCode._id.toString();
  }

  const byLegacy = await User.findOne({
    role: "student",
    studentId: trimmed,
  })
    .select("_id")
    .lean();

  return byLegacy ? byLegacy._id.toString() : null;
}
