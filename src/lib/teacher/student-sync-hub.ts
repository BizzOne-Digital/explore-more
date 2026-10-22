import connectDB from "@/lib/db";
import mongoose from "mongoose";
import {
  TeacherAssessment,
  TeacherClassAttendance,
  TeacherGradeAssignment,
  TeacherGradeScore,
  TeacherPlannerEntry,
  TeacherWorkspaceRecord,
} from "@/models";
import { currentSchoolYear } from "@/lib/tutor/school-year";
import { getRosterStudentForTeacher } from "@/lib/teacher/roster";

export async function getStudentSyncHub(teacherId: string, studentId: string) {
  await connectDB();
  const student = await getRosterStudentForTeacher(teacherId, studentId);
  if (!student) return null;

  const schoolYear = currentSchoolYear();
  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [
    attendanceRecent,
    assessments,
    assignmentRows,
    scores,
    scheduleBlocks,
    recordCounts,
  ] = await Promise.all([
    TeacherClassAttendance.find({
      teacherId,
      studentId,
      date: { $gte: since },
    })
      .sort({ date: -1 })
      .limit(20)
      .lean(),
    TeacherAssessment.find({ teacherId, schoolYear, studentId })
      .sort({ eventDate: -1 })
      .limit(15)
      .lean(),
    TeacherGradeAssignment.find({ teacherId, schoolYear }).select("_id title pointsPossible").lean(),
    TeacherGradeScore.find({ teacherId, studentId }).lean(),
    TeacherPlannerEntry.find({
      teacherId,
      schoolYear,
      studentId,
      date: { $gte: new Date() },
    })
      .sort({ date: 1, startTime: 1 })
      .limit(20)
      .lean(),
    TeacherWorkspaceRecord.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          teacherId: new mongoose.Types.ObjectId(teacherId),
          studentId: new mongoose.Types.ObjectId(studentId),
          schoolYear,
        },
      },
      { $group: { _id: "$recordType", count: { $sum: 1 } } },
    ]),
  ]);

  const assignmentMap = new Map(
    assignmentRows.map((a) => [String(a._id), { title: a.title, pointsPossible: a.pointsPossible }])
  );
  const gradeEntries = scores
    .map((s) => {
      const a = assignmentMap.get(String(s.assignmentId));
      if (!a) return null;
      return {
        assignmentId: String(s.assignmentId),
        title: a.title,
        score: s.score,
        pointsPossible: a.pointsPossible,
        status: s.status,
      };
    })
    .filter(Boolean);

  const records: Record<string, number> = {};
  for (const row of recordCounts) {
    records[row._id] = row.count;
  }

  return {
    student,
    schoolYear,
    attendanceRecent,
    assessments,
    gradeEntries,
    scheduleBlocks,
    records,
  };
}

export async function getRosterSyncOverview(teacherId: string) {
  await connectDB();
  const { listTeacherRoster } = await import("@/lib/teacher/roster");
  const schoolYear = currentSchoolYear();
  const roster = await listTeacherRoster(teacherId, schoolYear);
  if (roster.length === 0) return [];

  const studentIds = roster.map((s) => s.studentId);

  const [assessmentCounts, scoreCounts, recordCounts] = await Promise.all([
    TeacherAssessment.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          teacherId: new mongoose.Types.ObjectId(teacherId),
          schoolYear,
          studentId: { $in: studentIds.map((id) => new mongoose.Types.ObjectId(id)) },
        },
      },
      { $group: { _id: "$studentId", count: { $sum: 1 } } },
    ]),
    TeacherGradeScore.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          teacherId: new mongoose.Types.ObjectId(teacherId),
          studentId: { $in: studentIds.map((id) => new mongoose.Types.ObjectId(id)) },
        },
      },
      { $group: { _id: "$studentId", count: { $sum: 1 } } },
    ]),
    TeacherWorkspaceRecord.aggregate<{ _id: string; count: number }>([
      {
        $match: {
          teacherId: new mongoose.Types.ObjectId(teacherId),
          schoolYear,
          studentId: { $in: studentIds.map((id) => new mongoose.Types.ObjectId(id)) },
        },
      },
      { $group: { _id: "$studentId", count: { $sum: 1 } } },
    ]),
  ]);

  const toMap = (rows: { _id: string; count: number }[]) =>
    new Map(rows.map((r) => [String(r._id), r.count]));

  const aMap = toMap(assessmentCounts);
  const gMap = toMap(scoreCounts);
  const rMap = toMap(recordCounts);

  return roster.map((s) => ({
    ...s,
    assessmentCount: aMap.get(s.studentId) ?? 0,
    gradeEntryCount: gMap.get(s.studentId) ?? 0,
    recordCount: rMap.get(s.studentId) ?? 0,
  }));
}
