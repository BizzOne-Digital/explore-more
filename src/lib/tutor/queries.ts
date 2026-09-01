import connectDB from "@/lib/db";
import {
  Conversation,
  GuardianStudentLink,
  Resource,
  StaffInternalConversation,
  StudentProfile,
  TutorNotification,
  TutorSession,
  TutorStudentAssignment,
  User,
} from "@/models";
import { ensureTutorId } from "@/lib/tutor/tutor-id";

export async function getTutorProfile(userId: string) {
  await connectDB();
  const user = await User.findById(userId)
    .select("name email phone avatar role tutorId staffId isActive")
    .lean();
  if (!user) return null;

  const tutorId = user.tutorId ?? (await ensureTutorId(userId));
  const assignedCount = await TutorStudentAssignment.countDocuments({
    tutorId: userId,
    status: "active",
  });

  return {
    ...user,
    tutorId,
    assignedStudents: assignedCount,
  };
}

export async function getTutorDashboardStats(tutorUserId: string) {
  await connectDB();

  const [assignedStudents, unreadParentMessages, unreadStaffMessages, recentSessions, notifications] =
    await Promise.all([
      TutorStudentAssignment.countDocuments({ tutorId: tutorUserId, status: "active" }),
      Conversation.countDocuments({ staffId: tutorUserId, staffUnread: { $gt: 0 } }),
      StaffInternalConversation.countDocuments({
        participants: tutorUserId,
        [`unreadCounts.${tutorUserId}`]: { $gt: 0 },
      }),
      TutorSession.countDocuments({
        tutorId: tutorUserId,
        sessionDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
      TutorNotification.countDocuments({ userId: tutorUserId, readAt: { $exists: false } }),
    ]);

  const academyResources = await Resource.countDocuments({ isPublic: true });

  return {
    assignedStudents,
    unreadParentMessages,
    unreadStaffMessages,
    recentSessions,
    unreadNotifications: notifications,
    academyResources,
  };
}

export async function listTutorStudents(tutorUserId: string) {
  await connectDB();

  const assignments = await TutorStudentAssignment.find({
    tutorId: tutorUserId,
    status: "active",
  })
    .sort({ updatedAt: -1 })
    .lean();

  if (assignments.length === 0) return [];

  const studentIds = assignments.map((a) => a.studentId);
  const [students, profiles, guardians] = await Promise.all([
    User.find({ _id: { $in: studentIds } }).select("name email studentId").lean(),
    StudentProfile.find({ userId: { $in: studentIds } }).select("userId grade").lean(),
    GuardianStudentLink.find({ studentId: { $in: studentIds }, status: "approved" })
      .populate("guardianId", "name email")
      .lean(),
  ]);

  const studentMap = new Map(students.map((s) => [s._id.toString(), s]));
  const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));
  const guardianMap = new Map<string, { name?: string; email?: string }[]>();

  for (const link of guardians) {
    const sid = link.studentId.toString();
    const guardian = link.guardianId as unknown as { name?: string; email?: string };
    const list = guardianMap.get(sid) ?? [];
    list.push(guardian);
    guardianMap.set(sid, list);
  }

  return assignments.map((assignment) => {
    const sid = assignment.studentId.toString();
    const student = studentMap.get(sid);
    const profile = profileMap.get(sid);
    return {
      assignmentId: assignment._id.toString(),
      studentId: sid,
      studentName: student?.name ?? "Student",
      studentNumber: student?.studentId,
      grade: profile?.grade,
      subjects: assignment.subjects,
      scheduleNotes: assignment.scheduleNotes,
      learningGoals: assignment.learningGoals,
      tutorNotes: assignment.tutorNotes,
      guardians: guardianMap.get(sid) ?? [],
    };
  });
}

export type ResourcePublishStudent = {
  studentId: string;
  studentName: string;
  studentNumber?: string;
  grade?: string;
};

export async function listStudentsForResourcePublish(
  userId: string,
  role: string
): Promise<ResourcePublishStudent[]> {
  await connectDB();

  if (role === "administrator") {
    const students = await User.find({ role: "student", isActive: { $ne: false } })
      .select("name studentId")
      .sort({ name: 1 })
      .lean();

    if (students.length === 0) return [];

    const studentIds = students.map((s) => s._id);
    const profiles = await StudentProfile.find({ userId: { $in: studentIds } })
      .select("userId grade")
      .lean();
    const profileMap = new Map(profiles.map((p) => [p.userId.toString(), p]));

    return students.map((s) => ({
      studentId: s._id.toString(),
      studentName: s.name,
      studentNumber: s.studentId ?? undefined,
      grade: profileMap.get(s._id.toString())?.grade,
    }));
  }

  const assigned = await listTutorStudents(userId);
  return assigned.map((s) => ({
    studentId: s.studentId,
    studentName: s.studentName,
    studentNumber: s.studentNumber,
    grade: s.grade,
  }));
}

export async function getTutorStudentDetail(tutorUserId: string, studentId: string) {
  await connectDB();

  const assignment = await TutorStudentAssignment.findOne({
    tutorId: tutorUserId,
    studentId,
    status: "active",
  }).lean();

  if (!assignment) return null;

  const [student, profile, sessions, resources, guardians] = await Promise.all([
    User.findById(studentId).select("name email studentId").lean(),
    StudentProfile.findOne({ userId: studentId }).lean(),
    TutorSession.find({ tutorId: tutorUserId, studentId }).sort({ sessionDate: -1 }).limit(20).lean(),
    Resource.find({ assignedStudentIds: studentId, createdBy: tutorUserId })
      .sort({ createdAt: -1 })
      .lean(),
    GuardianStudentLink.find({ studentId, status: "approved" })
      .populate("guardianId", "name email guardianId")
      .lean(),
  ]);

  if (!student) return null;

  return {
    assignment: {
      id: assignment._id.toString(),
      subjects: assignment.subjects,
      scheduleNotes: assignment.scheduleNotes,
      learningGoals: assignment.learningGoals,
      tutorNotes: assignment.tutorNotes,
    },
    student: {
      id: studentId,
      name: student.name,
      studentId: student.studentId,
      email: student.email,
      grade: profile?.grade,
      bio: profile?.bio,
    },
    guardians: guardians.map((g) => {
      const parent = g.guardianId as unknown as {
        _id: string;
        name?: string;
        email?: string;
        guardianId?: string;
      };
      return {
        id: parent._id?.toString?.() ?? String(parent._id),
        name: parent.name,
        email: parent.email,
        guardianId: parent.guardianId,
        relationship: g.relationship,
      };
    }),
    sessions,
    resources,
  };
}
