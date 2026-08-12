import connectDB from "@/lib/db";
import { Course } from "@/models";
import { CourseForm } from "@/components/admin/forms/CourseForm";
import { toAdminRecord } from "@/lib/admin/serialize";
import { notFound } from "next/navigation";

export default async function EditCoursePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await connectDB();
  const course = await Course.findById(id).lean();
  if (!course) notFound();
  return <CourseForm initialData={toAdminRecord(course)} />;
}
