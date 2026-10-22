import { TeacherFeedbackClient } from "@/components/teacher/TeacherPortalToolsClient";

export const dynamic = "force-dynamic";

export default function TeacherFeedbackPage() {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold text-explore-charcoal">Feedback</h2>
      <p className="text-sm text-gray-500">Share ideas and issues with Explore More Academy.</p>
      <TeacherFeedbackClient />
    </div>
  );
}
