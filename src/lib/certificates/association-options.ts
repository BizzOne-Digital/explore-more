import connectDB from "@/lib/db";
import { Course, Program, Event } from "@/models";
import { serializeAdmin } from "@/lib/admin/serialize";

export interface CertificateAssociationOption {
  _id: string;
  title: string;
  startDate?: string;
}

export async function getCertificateAssociationOptions(): Promise<{
  courses: CertificateAssociationOption[];
  programs: CertificateAssociationOption[];
  events: CertificateAssociationOption[];
}> {
  await connectDB();

  const [courses, programs, events] = await Promise.all([
    Course.find({}, "title").sort({ title: 1 }).lean(),
    Program.find({}, "title").sort({ title: 1 }).lean(),
    Event.find({}, "title startDate").sort({ startDate: -1 }).lean(),
  ]);

  return {
    courses: serializeAdmin(courses) as unknown as CertificateAssociationOption[],
    programs: serializeAdmin(programs) as unknown as CertificateAssociationOption[],
    events: serializeAdmin(events) as unknown as CertificateAssociationOption[],
  };
}
