import connectDB from "@/lib/db";
import { Course, Program, Event } from "@/models";
import { serializeAdmin } from "@/lib/admin/serialize";
import type { GradeLevel } from "@/lib/grades";

export interface CertificateAssociationOption {
  _id: string;
  title: string;
  startDate?: string;
}

export async function getCertificateAssociationOptions(grade?: GradeLevel): Promise<{
  courses: CertificateAssociationOption[];
  programs: CertificateAssociationOption[];
  events: CertificateAssociationOption[];
}> {
  await connectDB();

  const filter = grade ? { grade } : {};

  const [courses, programs, events] = await Promise.all([
    Course.find(filter, "title").sort({ title: 1 }).lean(),
    Program.find(filter, "title").sort({ title: 1 }).lean(),
    Event.find(filter, "title startDate").sort({ startDate: -1 }).lean(),
  ]);

  return {
    courses: serializeAdmin(courses) as unknown as CertificateAssociationOption[],
    programs: serializeAdmin(programs) as unknown as CertificateAssociationOption[],
    events: serializeAdmin(events) as unknown as CertificateAssociationOption[],
  };
}
