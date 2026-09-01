import connectDB from "@/lib/db";
import { Certificate } from "@/models";
import { getLinkedStudents } from "@/lib/parent/students";

export type ParentCertificateItem = {
  id: string;
  studentId: string;
  studentName: string;
  title: string;
  description?: string;
  issueDate: Date;
  filePath: string;
  fileType: string;
  associatedCourse?: string;
  associatedProgram?: string;
  associatedEvent?: string;
};

export async function getCertificatesForGuardian(guardianId: string): Promise<ParentCertificateItem[]> {
  await connectDB();
  const students = await getLinkedStudents(guardianId);
  if (students.length === 0) return [];

  const studentIds = students.map((s) => s.id);
  const studentNameMap = new Map(students.map((s) => [s.id, s.name]));

  const certificates = await Certificate.find({
    studentId: { $in: studentIds },
    publishedToStudent: { $ne: false },
  })
    .sort({ issueDate: -1 })
    .lean();

  return certificates.map((cert) => ({
    id: cert._id.toString(),
    studentId: cert.studentId.toString(),
    studentName: studentNameMap.get(cert.studentId.toString()) ?? "Student",
    title: cert.title,
    description: cert.description,
    issueDate: cert.issueDate,
    filePath: cert.filePath,
    fileType: cert.fileType,
    associatedCourse: cert.associatedCourse,
    associatedProgram: cert.associatedProgram,
    associatedEvent: cert.associatedEvent,
  }));
}
