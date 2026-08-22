import connectDB from "@/lib/db";
import {
  Assessment,
  AssessmentSubmission,
  GuardianStudentLink,
  User,
} from "@/models";
import type { GradeLevel } from "@/lib/grades";
import { getStudentUserIdsByGrade } from "@/lib/grades/queries";

export interface GradeParentRow {
  parentId: string;
  parentName: string;
  parentEmail: string;
  studentId: string;
  studentName: string;
}

export async function getUniqueParentIdsForGrade(grade: GradeLevel): Promise<string[]> {
  await connectDB();
  const studentIds = await getStudentUserIdsByGrade(grade);
  if (studentIds.length === 0) return [];

  const guardianIds = await GuardianStudentLink.distinct("guardianId", {
    studentId: { $in: studentIds },
    status: "approved",
  });

  const parents = await User.find({
    _id: { $in: guardianIds },
    role: "parent",
    isActive: { $ne: false },
  })
    .select("_id")
    .lean();

  return parents.map((p) => p._id.toString());
}

export async function getGradeParentStudentRows(grade: GradeLevel): Promise<GradeParentRow[]> {
  await connectDB();
  const studentIds = await getStudentUserIdsByGrade(grade);
  if (studentIds.length === 0) return [];

  const links = await GuardianStudentLink.find({
    studentId: { $in: studentIds },
    status: "approved",
  }).lean();

  const parentIds = [...new Set(links.map((l) => l.guardianId.toString()))];
  const [parents, students] = await Promise.all([
    User.find({ _id: { $in: parentIds } }).select("name email").lean(),
    User.find({ _id: { $in: studentIds } }).select("name").lean(),
  ]);

  const parentMap = new Map(parents.map((p) => [p._id.toString(), p]));
  const studentMap = new Map(students.map((s) => [s._id.toString(), s]));

  const rows: GradeParentRow[] = [];
  for (const link of links) {
    const parent = parentMap.get(link.guardianId.toString());
    const student = studentMap.get(link.studentId.toString());
    if (!parent || !student) continue;
    rows.push({
      parentId: parent._id.toString(),
      parentName: parent.name,
      parentEmail: parent.email,
      studentId: student._id.toString(),
      studentName: student.name,
    });
  }

  rows.sort(
    (a, b) =>
      a.parentName.localeCompare(b.parentName) || a.studentName.localeCompare(b.studentName)
  );
  return rows;
}

export async function getAssessmentTrackerRows(assessmentId: string, grade: GradeLevel) {
  const [rows, submissions] = await Promise.all([
    getGradeParentStudentRows(grade),
    AssessmentSubmission.find({ assessmentId }).lean(),
  ]);

  const submissionMap = new Map(submissions.map((s) => [s.studentId.toString(), s]));

  return rows.map((row) => {
    const submission = submissionMap.get(row.studentId);
    return {
      ...row,
      resubmitted: Boolean(submission),
      submittedAt: submission?.submittedAt?.toISOString(),
      submissionId: submission?._id.toString(),
      submissionFilePath: submission?.filePath,
      letterGrade: submission?.letterGrade,
      published: submission?.published ?? false,
    };
  });
}

export async function getAssessmentsForParent(parentId: string) {
  await connectDB();
  const links = await GuardianStudentLink.find({
    guardianId: parentId,
    status: "approved",
  })
    .select("studentId")
    .lean();

  if (links.length === 0) return [];

  const studentIds = links.map((l) => l.studentId);
  const { StudentProfile } = await import("@/models");
  const profiles = await StudentProfile.find({ userId: { $in: studentIds } })
    .select("userId grade")
    .lean();

  const grades = [...new Set(profiles.map((p) => p.grade).filter(Boolean))] as string[];
  if (grades.length === 0) return [];

  const assessments = await Assessment.find({ grade: { $in: grades } })
    .sort({ createdAt: -1 })
    .lean();

  const submissions = await AssessmentSubmission.find({
    assessmentId: { $in: assessments.map((a) => a._id) },
    parentId,
  }).lean();

  const submissionByKey = new Map(
    submissions.map((s) => [`${s.assessmentId.toString()}:${s.studentId.toString()}`, s])
  );

  const studentGradeMap = new Map(profiles.map((p) => [p.userId.toString(), p.grade]));
  const students = await User.find({ _id: { $in: studentIds } }).select("name").lean();
  const studentNameMap = new Map(students.map((s) => [s._id.toString(), s.name]));

  return assessments.flatMap((assessment) => {
    const matchingStudents = profiles.filter((p) => p.grade === assessment.grade);
    return matchingStudents.map((profile) => {
      const studentId = profile.userId.toString();
      const submission = submissionByKey.get(`${assessment._id.toString()}:${studentId}`);
      return {
        assessmentId: assessment._id.toString(),
        title: assessment.title,
        grade: assessment.grade,
        filePath: assessment.filePath,
        studentId,
        studentName: studentNameMap.get(studentId) ?? "Student",
        submission: submission
          ? {
              _id: submission._id.toString(),
              filePath: submission.filePath,
              submittedAt: submission.submittedAt.toISOString(),
              letterGrade: submission.letterGrade,
              published: submission.published,
              publishedAt: submission.publishedAt?.toISOString(),
            }
          : null,
      };
    });
  });
}
