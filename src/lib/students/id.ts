import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { User } from "@/models";

export function generateStudentId(): string {
  return `STU-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

/** Assign Student IDs to any student accounts missing one. */
export async function ensureAllStudentIds(): Promise<number> {
  await connectDB();
  const missing = await User.find({
    role: "student",
    $or: [{ studentId: { $exists: false } }, { studentId: null }, { studentId: "" }],
  });

  await Promise.all(
    missing.map(async (user) => {
      user.studentId = generateStudentId();
      await user.save();
    })
  );

  return missing.length;
}

/** Ensure a single student has a Student ID; returns the code. */
export async function ensureStudentUserId(userId: string): Promise<string | undefined> {
  await connectDB();
  const user = await User.findOne({ _id: userId, role: "student" });
  if (!user) return undefined;

  if (!user.studentId) {
    user.studentId = generateStudentId();
    await user.save();
  }

  return user.studentId;
}

/** Resolve a Student ID code (STU-…) or MongoDB _id to the student's user _id. */
export async function resolveStudentUserId(identifier: string): Promise<string | null> {
  await connectDB();
  const trimmed = identifier.trim();
  if (!trimmed) return null;

  if (mongoose.Types.ObjectId.isValid(trimmed)) {
    const byObjectId = await User.findOne({ _id: trimmed, role: "student" }).select("_id").lean();
    if (byObjectId) return byObjectId._id.toString();
  }

  const byCode = await User.findOne({ studentId: trimmed, role: "student" }).select("_id").lean();
  return byCode ? byCode._id.toString() : null;
}
