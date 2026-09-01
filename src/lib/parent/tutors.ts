import connectDB from "@/lib/db";
import { TutorStudentAssignment, User, StaffProfile } from "@/models";
import { getLinkedStudents } from "@/lib/parent/students";

export type ParentAssignedTutor = {
  assignmentId: string;
  studentId: string;
  studentName: string;
  tutorUserId: string;
  tutorName: string;
  tutorIdCode?: string;
  title: string;
  bio?: string;
  specialties: string[];
  subjects: string[];
  scheduleNotes?: string;
  learningGoals?: string;
  status: "active" | "paused" | "ended";
  messagingAvailable: boolean;
};

async function enrichAssignments(
  assignments: Array<{
    _id: { toString(): string };
    tutorId: { toString(): string };
    studentId: { toString(): string };
    subjects: string[];
    scheduleNotes?: string;
    learningGoals?: string;
    status: "active" | "paused" | "ended";
  }>,
  studentNameMap: Map<string, string>
): Promise<ParentAssignedTutor[]> {
  if (assignments.length === 0) return [];

  const tutorIds = [...new Set(assignments.map((a) => a.tutorId.toString()))];
  const [tutors, profiles] = await Promise.all([
    User.find({ _id: { $in: tutorIds }, isActive: { $ne: false } }).select("name tutorId").lean(),
    StaffProfile.find({ userId: { $in: tutorIds } }).lean(),
  ]);

  const tutorMap = new Map(tutors.map((t) => [t._id.toString(), t]));
  const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

  return assignments
    .map((assignment) => {
      const tutorUserId = assignment.tutorId.toString();
      const tutor = tutorMap.get(tutorUserId);
      if (!tutor) return null;

      const profile = profileMap.get(tutorUserId);
      const studentId = assignment.studentId.toString();

      return {
        assignmentId: assignment._id.toString(),
        studentId,
        studentName: studentNameMap.get(studentId) ?? "Student",
        tutorUserId,
        tutorName: tutor.name,
        tutorIdCode: tutor.tutorId,
        title: profile?.title ?? "Tutor",
        bio: profile?.bio,
        specialties: profile?.specialties ?? [],
        subjects: assignment.subjects ?? [],
        scheduleNotes: assignment.scheduleNotes,
        learningGoals: assignment.learningGoals,
        status: assignment.status,
        messagingAvailable: profile?.messagingAvailable !== false,
      };
    })
    .filter(Boolean) as ParentAssignedTutor[];
}

/** Active or paused tutor assignments for all linked children of a guardian. */
export async function getAssignedTutorsForGuardian(guardianId: string): Promise<ParentAssignedTutor[]> {
  await connectDB();
  const students = await getLinkedStudents(guardianId);
  if (students.length === 0) return [];

  const studentIds = students.map((s) => s.id);
  const studentNameMap = new Map(students.map((s) => [s.id, s.name]));

  const assignments = await TutorStudentAssignment.find({
    studentId: { $in: studentIds },
    status: { $in: ["active", "paused"] },
  })
    .sort({ assignedAt: -1 })
    .lean();

  return enrichAssignments(assignments, studentNameMap);
}

/** Active or paused tutor assignments for a single student. */
export async function getAssignedTutorsForStudent(
  studentId: string,
  studentName?: string
): Promise<ParentAssignedTutor[]> {
  await connectDB();
  const student = studentName
    ? { id: studentId, name: studentName }
    : await User.findById(studentId).select("name").lean();

  const studentNameMap = new Map([
    [studentId, studentName ?? (student && "name" in student ? student.name : "Student")],
  ]);

  const assignments = await TutorStudentAssignment.find({
    studentId,
    status: { $in: ["active", "paused"] },
  })
    .sort({ assignedAt: -1 })
    .lean();

  return enrichAssignments(assignments, studentNameMap);
}

/** Map studentId → assigned tutors (for list views). */
export async function getAssignedTutorsByStudent(
  guardianId: string
): Promise<Map<string, ParentAssignedTutor[]>> {
  const assignments = await getAssignedTutorsForGuardian(guardianId);
  const byStudent = new Map<string, ParentAssignedTutor[]>();

  for (const assignment of assignments) {
    const list = byStudent.get(assignment.studentId) ?? [];
    list.push(assignment);
    byStudent.set(assignment.studentId, list);
  }

  return byStudent;
}
