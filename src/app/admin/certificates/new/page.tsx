import type { ComponentProps } from "react";
import connectDB from "@/lib/db";
import { User, Course, Program, Event } from "@/models";
import { CertificateForm } from "@/components/admin/forms/CertificateForm";
import { serializeAdmin } from "@/lib/admin/serialize";

type CertificateFormProps = ComponentProps<typeof CertificateForm>;

async function getData() {
  await connectDB();

  const [students, courses, programs, events] = await Promise.all([
    User.find({ role: "student" }, "name studentId").sort({ name: 1 }).lean(),
    Course.find({ status: "published" }, "title").sort({ title: 1 }).lean(),
    Program.find({ status: "published" }, "title").sort({ title: 1 }).lean(),
    Event.find({ status: "published" }, "title").sort({ title: 1 }).lean(),
  ]);

  return {
    students: serializeAdmin(students) as unknown as CertificateFormProps["students"],
    courses: serializeAdmin(courses) as unknown as CertificateFormProps["courses"],
    programs: serializeAdmin(programs) as unknown as CertificateFormProps["programs"],
    events: serializeAdmin(events) as unknown as CertificateFormProps["events"],
  };
}

export default async function Page() {
  const data = await getData();
  return <CertificateForm isNew {...data} />;
}
