import type { ComponentProps } from "react";
import connectDB from "@/lib/db";
import { User, StudentProfile, GuardianStudentLink } from "@/models";
import { StudentForm } from "@/components/admin/forms/StudentForm";
import { serializeAdmin, toAdminRecord } from "@/lib/admin/serialize";
import { notFound } from "next/navigation";

export default async function StudentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();

  const student = await User.findOne({ _id: id, role: "student" }).select("-passwordHash").lean();
  if (!student) notFound();

  const [profile, guardianLinks] = await Promise.all([
    StudentProfile.findOne({ userId: id }).lean(),
    GuardianStudentLink.find({ studentId: id }).populate("guardianId", "name email").lean(),
  ]);

  const initialData = toAdminRecord({
    ...serializeAdmin(student),
    ...(profile ? serializeAdmin(profile) : {}),
  });

  return (
    <StudentForm
      initialData={initialData}
      guardianLinks={serializeAdmin(guardianLinks) as unknown as ComponentProps<typeof StudentForm>["guardianLinks"]}
    />
  );
}
