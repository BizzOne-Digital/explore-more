import type { ComponentProps } from "react";
import connectDB from "@/lib/db";
import { User, GuardianStudentLink } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { StudentsTable } from "@/components/admin/StudentsTable";
import { serializeAdmin } from "@/lib/admin/serialize";

async function getData() {
  await connectDB();
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
        description="Student accounts and profiles"
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
