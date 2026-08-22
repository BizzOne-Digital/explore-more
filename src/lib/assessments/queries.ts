import connectDB from "@/lib/db";
import {
  Assessment,
  AssessmentSubmission,
  GuardianStudentLink,
  ParentProfile,
  User,
} from "@/models";
import type { GradeLevel } from "@/lib/grades";
import { isGradeLevel } from "@/lib/grades";
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
  const ids = new Set<string>();

  const studentIds = await getStudentUserIdsByGrade(grade);
  if (studentIds.length > 0) {
    const guardianIds = await GuardianStudentLink.distinct("guardianId", {
      studentId: { $in: studentIds },
      status: "approved",
    });

    const linkedParents = await User.find({
      _id: { $in: guardianIds },
      role: "parent",
      isActive: { $ne: false },
    })
      .select("_id")
      .lean();

    for (const parent of linkedParents) {
      ids.add(parent._id.toString());
    }
  }

  const profileParents = await ParentProfile.find({ childGrade: grade }).select("userId").lean();
  if (profileParents.length > 0) {
    const activeParents = await User.find({
      _id: { $in: profileParents.map((p) => p.userId) },
      role: "parent",
      isActive: { $ne: false },
    })
      .select("_id")
      .lean();

    for (const parent of activeParents) {
      ids.add(parent._id.toString());
    }
  }

  return [...ids];
}

export async function getGradeParentStudentRows(grade: GradeLevel): Promise<GradeParentRow[]> {
  await connectDB();
  const rows: GradeParentRow[] = [];
  const seen = new Set<string>();

  const studentIds = await getStudentUserIdsByGrade(grade);
  if (studentIds.length > 0) {
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

    for (const link of links) {
      const parent = parentMap.get(link.guardianId.toString());
      const student = studentMap.get(link.studentId.toString());
      if (!parent || !student) continue;
      const key = `${parent._id.toString()}:${student._id.toString()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push({
        parentId: parent._id.toString(),
        parentName: parent.name,
        parentEmail: parent.email,
        studentId: student._id.toString(),
        studentName: student.name,
      });
    }
  }

  const profileParents = await ParentProfile.find({ childGrade: grade })
    .select("userId")
    .lean();
  if (profileParents.length > 0) {
    const parents = await User.find({
      _id: { $in: profileParents.map((p) => p.userId) },
      role: "parent",
      isActive: { $ne: false },
    })
      .select("name email")
      .lean();

    for (const parent of parents) {
      const hasStudentRow = rows.some((r) => r.parentId === parent._id.toString());
      if (!hasStudentRow) {
        const key = `${parent._id.toString()}:profile`;
        if (!seen.has(key)) {
          seen.add(key);
          rows.push({
            parentId: parent._id.toString(),
            parentName: parent.name,
            parentEmail: parent.email,
            studentId: "",
            studentName: "Child (link student account)",
          });
        }
      }
    }
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
    const submission = row.studentId ? submissionMap.get(row.studentId) : undefined;
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

  const [links, pendingLinks, parentProfile] = await Promise.all([
    GuardianStudentLink.find({
      guardianId: parentId,
      status: "approved",
    })
      .select("studentId")
      .lean(),
    GuardianStudentLink.countDocuments({
      guardianId: parentId,
      status: "pending",
    }),
    ParentProfile.findOne({ userId: parentId }).select("childGrade").lean(),
  ]);

  const approvedStudentIds = links.map((l) => l.studentId.toString());
  const { StudentProfile } = await import("@/models");

  const profiles =
    approvedStudentIds.length > 0
      ? await StudentProfile.find({ userId: { $in: approvedStudentIds } }).select("userId grade").lean()
      : [];

  const grades = new Set<string>();
  if (parentProfile?.childGrade && isGradeLevel(parentProfile.childGrade)) {
    grades.add(parentProfile.childGrade);
  }
  for (const profile of profiles) {
    if (profile.grade && isGradeLevel(profile.grade)) {
      grades.add(profile.grade);
    }
  }

  if (grades.size === 0) {
    return { items: [], hasPendingLink: pendingLinks > 0 };
  }

  const assessments = await Assessment.find({ grade: { $in: [...grades] } })
    .sort({ createdAt: -1 })
    .lean();

  if (assessments.length === 0) {
    return { items: [], hasPendingLink: pendingLinks > 0 };
  }

  const submissions = await AssessmentSubmission.find({
    assessmentId: { $in: assessments.map((a) => a._id) },
    parentId,
  }).lean();

  const submissionByKey = new Map(
    submissions.map((s) => [`${s.assessmentId.toString()}:${s.studentId.toString()}`, s])
  );

  const students =
    approvedStudentIds.length > 0
      ? await User.find({ _id: { $in: approvedStudentIds } }).select("name").lean()
      : [];
  const studentNameMap = new Map(students.map((s) => [s._id.toString(), s.name]));

  const items: Array<{
    assessmentId: string;
    title: string;
    grade: string;
    filePath: string;
    studentId: string | null;
    studentName: string;
    canResubmit: boolean;
    submission: {
      _id: string;
      filePath: string;
      submittedAt: string;
      letterGrade?: string;
      published: boolean;
      publishedAt?: string;
    } | null;
  }> = [];

  for (const assessment of assessments) {
    const studentsForAssessment = new Map<string, boolean>();

    for (const profile of profiles) {
      if (profile.grade === assessment.grade) {
        studentsForAssessment.set(profile.userId.toString(), true);
      }
    }

    // Parent signup grade can differ from the student profile grade field — still allow resubmit
    // when the child is linked and approved.
    if (parentProfile?.childGrade === assessment.grade) {
      for (const studentId of approvedStudentIds) {
        if (!studentsForAssessment.has(studentId)) {
          studentsForAssessment.set(studentId, true);
        }
      }
    }

    if (studentsForAssessment.size > 0) {
      for (const [studentId] of studentsForAssessment) {
        const submission = submissionByKey.get(`${assessment._id.toString()}:${studentId}`);
        items.push({
          assessmentId: assessment._id.toString(),
          title: assessment.title,
          grade: assessment.grade,
          filePath: assessment.filePath,
          studentId,
          studentName: studentNameMap.get(studentId) ?? "Student",
          canResubmit: true,
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
        });
      }
      continue;
    }

    if (parentProfile?.childGrade === assessment.grade) {
      items.push({
        assessmentId: assessment._id.toString(),
        title: assessment.title,
        grade: assessment.grade,
        filePath: assessment.filePath,
        studentId: null,
        studentName: "Your child",
        canResubmit: false,
        submission: null,
      });
    }
  }

  return { items, hasPendingLink: pendingLinks > 0 };
}
