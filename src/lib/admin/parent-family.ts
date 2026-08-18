import {
  User,
  GuardianStudentLink,
  Enrollment,
  Course,
  ServiceRequest,
  Program,
  Attendance,
  Conversation,
  PortfolioWorkSample,
  HomeschoolPortfolio,
  ParentProfile,
} from "@/models";
import type { Types } from "mongoose";

export async function getParentFamilyData(parentUserId: string) {
  const parent = await User.findById(parentUserId).select("name email").lean();
  if (!parent) throw new Error("Parent not found");

  const links = await GuardianStudentLink.find({ guardianId: parentUserId })
    .populate("studentId", "name email studentId isActive")
    .lean();

  const studentIds = links
    .map((l) => {
      const student = l.studentId as { _id?: Types.ObjectId } | null;
      return student?._id?.toString();
    })
    .filter(Boolean) as string[];

  const studentObjectIds = studentIds as unknown as Types.ObjectId[];

  const [enrollments, serviceRequests, attendance, conversations, workSamples, portfolios] =
    await Promise.all([
      studentObjectIds.length
        ? Enrollment.find({ userId: { $in: studentObjectIds } })
            .populate("courseId", "title slug status")
            .sort({ enrolledAt: -1 })
            .lean()
        : [],
      ServiceRequest.find({ email: parent.email }).sort({ createdAt: -1 }).limit(20).lean(),
      studentObjectIds.length
        ? Attendance.find({ studentId: { $in: studentObjectIds } })
            .populate("courseId", "title")
            .populate("eventId", "title")
            .sort({ sessionDate: -1 })
            .limit(50)
            .lean()
        : [],
      Conversation.find({ parentId: parentUserId })
        .populate("staffId", "name email")
        .populate("studentId", "name studentId")
        .sort({ lastMessageAt: -1 })
        .limit(20)
        .lean(),
      studentObjectIds.length
        ? PortfolioWorkSample.find({ studentId: { $in: studentObjectIds } })
            .sort({ dateCompleted: -1 })
            .limit(30)
            .lean()
        : [],
      studentObjectIds.length
        ? HomeschoolPortfolio.find({ studentId: { $in: studentObjectIds } })
            .select("studentId schoolYear status")
            .lean()
        : [],
    ]);

  const programIds = [...new Set(serviceRequests.map((r) => r.programId.toString()))];
  const programs = programIds.length
    ? await Program.find({ _id: { $in: programIds } }).select("title slug").lean()
    : [];
  const programMap = new Map(programs.map((p) => [p._id.toString(), p]));

  return {
    children: links.map((link) => {
      const student = link.studentId as unknown as {
        _id: Types.ObjectId;
        name: string;
        email: string;
        studentId?: string;
        isActive?: boolean;
      } | null;
      return {
        linkId: link._id.toString(),
        relationship: link.relationship,
        status: link.status,
        student: student
          ? {
              id: student._id.toString(),
              name: student.name,
              email: student.email,
              studentId: student.studentId,
              isActive: student.isActive,
            }
          : null,
      };
    }),
    enrollments: enrollments.map((e) => {
      const course = e.courseId as { title?: string; slug?: string; status?: string } | null;
      return {
        id: e._id.toString(),
        studentId: e.userId.toString(),
        courseTitle: course?.title ?? "Course",
        courseSlug: course?.slug,
        paymentStatus: e.paymentStatus,
        status: e.status,
        progress: e.progress,
        enrolledAt: e.enrolledAt,
      };
    }),
    serviceRequests: serviceRequests.map((r) => ({
      id: r._id.toString(),
      programTitle: programMap.get(r.programId.toString())?.title ?? r.programSlug,
      studentName: r.studentName,
      status: r.status,
      requestType: r.requestType,
      createdAt: r.createdAt,
    })),
    attendance: attendance.map((a) => {
      const course = a.courseId as { title?: string } | null;
      const event = a.eventId as { title?: string } | null;
      return {
        id: a._id.toString(),
        studentId: a.studentId.toString(),
        sessionDate: a.sessionDate,
        status: a.status,
        title: course?.title ?? event?.title ?? "Session",
        excuseNote: a.parentExcuseNote ?? a.notes,
      };
    }),
    messages: conversations.map((c) => {
      const staff = c.staffId as { name?: string; email?: string } | null;
      const student = c.studentId as { name?: string; studentId?: string } | null;
      return {
        id: c._id.toString(),
        subject: c.subject,
        staffName: staff?.name ?? "Staff",
        studentName: student?.name,
        lastMessageAt: c.lastMessageAt,
        staffUnread: c.staffUnread,
        parentUnread: c.parentUnread,
      };
    }),
    documents: workSamples.map((w) => ({
      id: w._id.toString(),
      studentId: w.studentId.toString(),
      assignmentName: w.assignmentName,
      subject: w.subject,
      dateCompleted: w.dateCompleted,
      fileCount: w.files?.length ?? 0,
    })),
    portfolios: portfolios.map((p) => ({
      id: p._id.toString(),
      studentId: p.studentId.toString(),
      schoolYear: p.schoolYear,
      status: p.status,
    })),
  };
}

export async function getParentProfileBundle(userId: string) {
  const [user, profile] = await Promise.all([
    User.findById(userId)
      .select("name email phone guardianId isActive emailVerified createdAt notificationPreferences")
      .lean(),
    ParentProfile.findOne({ userId }).lean(),
  ]);
  if (!user) throw new Error("User not found");
  return { user, profile };
}
