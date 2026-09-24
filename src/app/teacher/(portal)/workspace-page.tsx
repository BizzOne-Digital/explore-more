import { WorkspaceModuleView } from "@/components/tutor/workspace/WorkspaceModuleView";

export const dynamic = "force-dynamic";

export function createTeacherWorkspacePage(pageKey: string) {
  return function TeacherWorkspacePage() {
    return <WorkspaceModuleView pageKey={pageKey} />;
  };
}
