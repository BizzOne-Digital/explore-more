import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ParentToolsHeader } from "@/components/parent/ParentToolsHeader";
import { TranscriptGeneratorForm } from "@/components/resources/TranscriptGeneratorForm";
import { getParentToolsContext } from "@/lib/parent/tools";

export default async function ParentTranscriptGeneratorPage() {
  const session = await auth();
  if (!session?.user) redirect("/parent/login?callbackUrl=/parent/tools/transcript");

  const { linkedStudents, defaultHomeschoolName } = await getParentToolsContext(session.user.id);

  return (
    <div className="space-y-6">
      <ParentToolsHeader
        title="Transcript Generator"
        description="Build a homeschool transcript PDF for your child. Grades, credits, and GPA calculate automatically."
      />
      <TranscriptGeneratorForm
        linkedStudents={linkedStudents}
        defaultHomeschoolName={defaultHomeschoolName}
      />
    </div>
  );
}
