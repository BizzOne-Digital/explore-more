import connectDB from "@/lib/db";
import { GuardianStudentLink, StudentProfile, User } from "@/models";
import { hashPassword } from "@/lib/password";
import { generateUniqueStudentId } from "@/lib/students/id";
import { studentPlaceholderEmail } from "@/lib/students/placeholder-email";
import { isGradeLevel } from "@/lib/grades";

export type CreateStudentAccountInput = {
  name: string;
  password: string;
  email?: string;
  grade?: string;
  dateOfBirth?: Date;
  /** When set, creates an approved guardian link. */
  guardianId?: string;
  relationship?: string;
  /** Parent-created accounts skip inbox verification. */
  emailVerified?: boolean;
};

export type CreateStudentAccountResult = {
  userId: string;
  studentId: string;
  email: string;
  usedPlaceholderEmail: boolean;
};

export async function createStudentAccount(
  input: CreateStudentAccountInput
): Promise<CreateStudentAccountResult> {
  const name = input.name.trim();
  if (name.length < 2) {
    throw new Error("Student name is required");
  }
  if (input.password.length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const rawEmail = input.email?.trim().toLowerCase();
  const grade = input.grade?.trim();
  if (grade && !isGradeLevel(grade)) {
    throw new Error("Invalid grade");
  }

  await connectDB();

  const studentId = await generateUniqueStudentId();
  let email = rawEmail || studentPlaceholderEmail(studentId);
  const usedPlaceholderEmail = !rawEmail;

  if (rawEmail) {
    const taken = await User.findOne({ email: rawEmail }).select("_id").lean();
    if (taken) {
      throw new Error("That email is already registered");
    }
  } else {
    const taken = await User.findOne({ email }).select("_id").lean();
    if (taken) {
      email = studentPlaceholderEmail(`${studentId}x${Math.random().toString(36).slice(2, 6)}`);
    }
  }

  const passwordHash = await hashPassword(input.password);
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: "student",
    studentId,
    emailVerified: input.emailVerified ?? usedPlaceholderEmail,
    isActive: true,
  });

  await StudentProfile.create({
    userId: user._id,
    grade: grade || undefined,
    dateOfBirth: input.dateOfBirth,
  });

  if (input.guardianId) {
    await GuardianStudentLink.create({
      guardianId: input.guardianId,
      studentId: user._id,
      relationship: (input.relationship ?? "Parent").trim() || "Parent",
      status: "approved",
      consentGiven: true,
      consentDate: new Date(),
    });
  }

  return {
    userId: user._id.toString(),
    studentId,
    email,
    usedPlaceholderEmail,
  };
}
