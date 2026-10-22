import { TeacherArchiveClient } from "@/components/teacher/TeacherPortalToolsClient";

export const dynamic = "force-dynamic";

export default function TeacherArchivePage() {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold text-explore-charcoal">Archive</h2>
      <p className="text-sm text-gray-500">Archived lesson plans from prior terms.</p>
      <TeacherArchiveClient />
    </div>
  );
}
