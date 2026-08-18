import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { User } from "@/models";
import {
  normalizeStudentIdInput,
  randomStudentIdCandidate,
} from "@/lib/students/id-codegen";

export { formatStudentId, isValidStudentIdFormat, normalizeStudentIdInput, STUDENT_ID_LENGTH } from "@/lib/students/id-codegen";

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

/** Assign Student IDs to any student accounts missing one. */
export async function ensureAllStudentIds(): Promise<number> {
  await connectDB();
  const missing = await User.find({
    role: "student",
    $or: [{ studentId: { $exists: false } }, { studentId: null }, { studentId: "" }],
  });

  let assigned = 0;
  for (const user of missing) {
    user.studentId = await generateUniqueStudentId();
    await user.save();
    assigned++;
  }

  return assigned;
}

/** Ensure a single student has a Student ID; returns the code. */
export async function ensureStudentUserId(userId: string): Promise<string | undefined> {
  await connectDB();
  const user = await User.findOne({ _id: userId, role: "student" });
  if (!user) return undefined;

  if (!user.studentId) {
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

  const normalized = /^\d+$/.test(trimmed) ? normalizeStudentIdInput(trimmed) : trimmed;

  const byCode = await User.findOne({
    role: "student",
    $or: [{ studentId: trimmed }, { studentId: normalized }],
  })
    .select("_id")
    .lean();

  return byCode ? byCode._id.toString() : null;
}
