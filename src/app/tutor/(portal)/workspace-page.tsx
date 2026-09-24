import { WorkspaceModuleView } from "@/components/tutor/workspace/WorkspaceModuleView";

export const dynamic = "force-dynamic";

export function createTutorWorkspacePage(pageKey: string) {
  return function TutorWorkspacePage() {
    return <WorkspaceModuleView pageKey={pageKey} />;
  };
}
