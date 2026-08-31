import connectDB from "@/lib/db";
import { User } from "@/models";
import { PageHeader } from "@/components/admin/PageHeader";
import { IssueSingleCertificateForm } from "@/components/admin/forms/IssueSingleCertificateForm";
import { serializeAdmin } from "@/lib/admin/serialize";
import { ensureAllStudentIds } from "@/lib/students/id";

export default async function IssueSingleCertificatePage() {
  await connectDB();
  await ensureAllStudentIds();

  const students = await User.find({ role: "student" })
    .select("name studentId")
    .sort({ name: 1 })
    .lean();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Issue Single Certificate"
        description="Search for a student by name or Student ID, upload a certificate, preview it, and issue it to their account."
      />
      <IssueSingleCertificateForm
        students={
          serializeAdmin(students) as unknown as Array<{
            _id: string;
            name: string;
            studentId?: string;
          }>
        }
      />
    </div>
  );
}
