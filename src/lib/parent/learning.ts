import connectDB from "@/lib/db";
import { Course, Enrollment, Resource, UserDocument } from "@/models";
import { getLinkedStudents } from "@/lib/parent/students";

export type ParentCourseEnrollment = {
  id: string;
  studentId: string;
  studentName: string;
  courseId: string;
  courseTitle: string;
  courseSlug: string;
  shortDescription?: string;
  instructor?: string;
  progress: number;
  completedLessons: number;
  totalLessons: number;
  status: string;
  paymentStatus: string;
  enrolledAt: Date;
};

export type ParentLearningResource = {
  id: string;
  title: string;
  description?: string;
  type: string;
  url?: string;
  filePath?: string;
  courseTitle?: string;
  studentName?: string;
  source: "academy" | "account";
  uploadedByName?: string;
  createdAt: Date;
};

export async function getParentCourseEnrollments(
  guardianId: string
): Promise<ParentCourseEnrollment[]> {
  await connectDB();
  const students = await getLinkedStudents(guardianId);
  if (students.length === 0) return [];

  const studentIds = students.map((s) => s.id);
  const studentNames = new Map(students.map((s) => [s.id, s.name]));

  const enrollments = await Enrollment.find({
    userId: { $in: studentIds },
    status: { $ne: "cancelled" },
  })
    .populate("courseId")
    .sort({ enrolledAt: -1 });

  const items: ParentCourseEnrollment[] = [];

  for (const enrollment of enrollments) {
    const course = enrollment.courseId as unknown as InstanceType<typeof Course> | null;
    if (!course) continue;

    const studentId = enrollment.userId.toString();
    const totalLessons = course.modules.reduce((sum, m) => sum + m.lessons.length, 0);

    items.push({
      id: enrollment._id.toString(),
      studentId,
      studentName: studentNames.get(studentId) ?? "Student",
      courseId: course._id.toString(),
      courseTitle: course.title,
      courseSlug: course.slug,
      shortDescription: course.shortDescription,
      instructor: course.instructor,
      progress: enrollment.progress,
      completedLessons: enrollment.completedLessons.length,
      totalLessons,
      status: enrollment.status,
      paymentStatus: enrollment.paymentStatus,
      enrolledAt: enrollment.enrolledAt,
    });
  }

  return items;
}

export async function getParentLearningResources(
  guardianId: string
): Promise<ParentLearningResource[]> {
  await connectDB();
  const students = await getLinkedStudents(guardianId);
  const studentIds = students.map((s) => s.id);
  const studentNames = new Map(students.map((s) => [s.id, s.name]));
  const accountUserIds = [guardianId, ...studentIds];

  const [resources, documents] = await Promise.all([
    studentIds.length > 0
      ? Resource.find({
          $or: [{ isPublic: true }, { assignedStudentIds: { $in: studentIds } }],
        })
          .populate("courseId", "title")
          .populate("createdBy", "name")
          .sort({ createdAt: -1 })
      : Resource.find({ isPublic: true })
          .populate("courseId", "title")
          .populate("createdBy", "name")
          .sort({ createdAt: -1 }),
    UserDocument.find({ userId: { $in: accountUserIds } })
      .sort({ createdAt: -1 }),
  ]);

  const items: ParentLearningResource[] = [];

  for (const resource of resources) {
    const course = resource.courseId as { title?: string } | null;
    const creator = resource.createdBy as { name?: string } | null;
    const assignedId = resource.assignedStudentIds[0]?.toString();

    items.push({
      id: resource._id.toString(),
      title: resource.title,
      description: resource.description,
      type: resource.type,
      url: resource.url,
      filePath: resource.filePath,
      courseTitle: course?.title,
      studentName: assignedId ? studentNames.get(assignedId) : undefined,
      source: "academy",
      uploadedByName: creator?.name,
      createdAt: resource.createdAt,
    });
  }

  for (const doc of documents) {
    const ownerId = doc.userId.toString();
    const owner =
      ownerId === guardianId
        ? "Your account"
        : (studentNames.get(ownerId) ?? "Student");

    items.push({
      id: doc._id.toString(),
      title: doc.label || doc.originalName,
      description: doc.originalName !== (doc.label || doc.originalName) ? doc.originalName : undefined,
      type: "file",
      filePath: doc.path,
      studentName: ownerId === guardianId ? undefined : owner,
      source: "account",
      uploadedByName: doc.uploadedByName,
      createdAt: doc.createdAt,
    });
  }

  items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  return items;
}
