import { PageHeader } from "@/components/admin/PageHeader";
import { TeacherFeedbackAdminClient } from "@/components/admin/TeacherFeedbackAdminClient";

export const dynamic = "force-dynamic";

export default function AdminTeacherFeedbackPage() {
  return (
    <div>
      <PageHeader
        title="Teacher portal feedback"
        description="Messages submitted from the teacher portal Feedback page."
      />
      <TeacherFeedbackAdminClient />
    </div>
  );
}
