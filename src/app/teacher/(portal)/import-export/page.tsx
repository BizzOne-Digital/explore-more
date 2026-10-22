import { TeacherImportExportClient } from "@/components/teacher/TeacherPortalToolsClient";

export const dynamic = "force-dynamic";

export default function TeacherImportExportPage() {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-bold text-explore-charcoal">Import / Export</h2>
      <TeacherImportExportClient />
    </div>
  );
}
