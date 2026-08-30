import type { ComponentProps } from "react";
import connectDB from "@/lib/db";
import { User, StudentProfile, GuardianStudentLink } from "@/models";
import { StudentForm } from "@/components/admin/forms/StudentForm";
import { serializeAdmin } from "@/lib/admin/serialize";
import { buildStudentFormInitialData } from "@/lib/admin/student-form-data";
import { notFound } from "next/navigation";
import { ensureStudentUserId } from "@/lib/students/id";
import { isValidObjectId } from "@/lib/admin/api";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  await connectDB();

  const student = await User.findOne({ _id: id, role: "student" }).select("-passwordHash").lean();
  if (!student) notFound();

  await ensureStudentUserId(id);

  const refreshedStudent = await User.findOne({ _id: id, role: "student" }).select("-passwordHash").lean();
  if (!refreshedStudent) notFound();

  const [profile, guardianLinks, parents] = await Promise.all([
    StudentProfile.findOne({ userId: id }).lean(),
    GuardianStudentLink.find({ studentId: id }).populate("guardianId", "name email").lean(),
    User.find({ role: "parent" }).select("name email").sort({ name: 1 }).lean(),
  ]);

  const initialData = buildStudentFormInitialData(
    refreshedStudent as unknown as Record<string, unknown>,
    profile as Record<string, unknown> | null
  );

  return (
    <StudentForm
      initialData={initialData}
      guardianLinks={serializeAdmin(guardianLinks) as unknown as ComponentProps<typeof StudentForm>["guardianLinks"]}
      parents={serializeAdmin(parents) as unknown as ComponentProps<typeof StudentForm>["parents"]}
    />
  );
}
