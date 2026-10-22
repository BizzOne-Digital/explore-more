import { TeacherTemplatesClient } from "@/components/teacher/TeacherPortalToolsClient";

export const dynamic = "force-dynamic";

export default function TeacherTemplatesPage() {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold text-explore-charcoal">Lesson templates</h2>
      <p className="text-sm text-gray-500">Reuse saved templates to start new lesson plans faster.</p>
      <TeacherTemplatesClient />
    </div>
  );
}
