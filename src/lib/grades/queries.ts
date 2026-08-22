import connectDB from "@/lib/db";
import { StudentProfile, User } from "@/models";
import type { GradeLevel } from "@/lib/grades";
import { isGradeLevel } from "@/lib/grades";

export async function getStudentUserIdsByGrade(grade: GradeLevel): Promise<string[]> {
  await connectDB();
  const profiles = await StudentProfile.find({ grade }).select("userId").lean();
  return profiles.map((p) => p.userId.toString());
}

export async function getStudentsForGrade(grade: GradeLevel) {
  await connectDB();
  const profiles = await StudentProfile.find({ grade }).select("userId").lean();
  const userIds = profiles.map((p) => p.userId);
  if (userIds.length === 0) return [];

  return User.find({ _id: { $in: userIds }, role: "student" })
    .select("name studentId email")
    .sort({ name: 1 })
    .lean();
}

export async function getStudentGrade(userId: string): Promise<GradeLevel | null> {
  await connectDB();
  const profile = await StudentProfile.findOne({ userId }).select("grade").lean();
  if (!profile?.grade) return null;
  return profile.grade as GradeLevel;
}

export async function getParentChildrenGrades(parentUserId: string): Promise<GradeLevel[]> {
  await connectDB();
  const { GuardianStudentLink, ParentProfile } = await import("@/models");

  const grades = new Set<GradeLevel>();

  const parentProfile = await ParentProfile.findOne({ userId: parentUserId })
    .select("childGrade")
    .lean();
  if (parentProfile?.childGrade && isGradeLevel(parentProfile.childGrade)) {
    grades.add(parentProfile.childGrade);
  }

  const links = await GuardianStudentLink.find({
    guardianId: parentUserId,
    status: "approved",
  })
    .select("studentId")
    .lean();

  if (links.length > 0) {
    const studentIds = links.map((l) => l.studentId);
    const profiles = await StudentProfile.find({ userId: { $in: studentIds } })
      .select("grade")
      .lean();

    for (const p of profiles) {
      if (p.grade && isGradeLevel(p.grade)) grades.add(p.grade);
    }
  }

  return [...grades];
}

export async function getPublishedCoursesForGrade(grade: GradeLevel) {
  await connectDB();
  const { Course } = await import("@/models");
  return Course.find({ grade, status: "published" })
    .select("title slug shortDescription instructor")
    .sort({ title: 1 })
    .lean();
}

export async function getPublishedEventsForGrade(grade: GradeLevel) {
  await connectDB();
  const { Event } = await import("@/models");
  return Event.find({ grade, status: "published" })
    .select("title slug startDate location")
    .sort({ startDate: 1 })
    .lean();
}

export async function getPublishedProgramsForGrade(grade: GradeLevel) {
  await connectDB();
  const { Program } = await import("@/models");
  return Program.find({ grade, status: "published" })
    .select("title slug tagline shortDescription")
    .sort({ listingOrder: 1, title: 1 })
    .lean();
}
