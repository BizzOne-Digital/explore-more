import type { ComponentProps } from "react";
import connectDB from "@/lib/db";
import { User, GuardianStudentLink } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { StudentsTable } from "@/components/admin/StudentsTable";
import { serializeAdmin } from "@/lib/admin/serialize";
import { ensureAllStudentIds } from "@/lib/students/id";

async function getData() {
  await connectDB();
  await ensureAllStudentIds();

  const students = await User.find({ role: "student" }).sort({ createdAt: -1 }).lean();

  const studentIds = students.map((s) => s._id);
  const links = await GuardianStudentLink.find({
    studentId: { $in: studentIds },
    status: "approved",
  })
    .populate("guardianId", "name email")
    .lean();

  return {
    students: serializeAdmin(students),
    guardianLinks: serializeAdmin(links),
  };
}

export default async function Page({ searchParams }: { searchParams: Promise<{ search?: string }> }) {
  const { search } = await searchParams;
  const { students, guardianLinks } = await getData();

  return (
    <div>
      <PageHeader
        title="Students"
        description="Each student has a unique Student ID (e.g. STU-…) used to link parent accounts in Guardian Links."
        action={{ label: "New Student", href: "/admin/students/new" }}
      />
      <StudentsTable
        students={students as unknown as ComponentProps<typeof StudentsTable>["students"]}
        guardianLinks={guardianLinks as unknown as ComponentProps<typeof StudentsTable>["guardianLinks"]}
        initialSearch={search}
      />
    </div>
  );
}
