import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ParentToolsHeader } from "@/components/parent/ParentToolsHeader";
import { CertificateGeneratorForm } from "@/components/resources/CertificateGeneratorForm";
import { getParentToolsContext } from "@/lib/parent/tools";

export default async function ParentCertificateGeneratorPage() {
  const session = await auth();
  if (!session?.user) redirect("/parent/login?callbackUrl=/parent/tools/certificate");

  const { linkedStudents, defaultHomeschoolName } = await getParentToolsContext(session.user.id);

  return (
    <div className="space-y-6">
      <ParentToolsHeader
        title="Certificate Generator"
        description="Create a printable certificate of completion PDF for your homeschool student."
      />
      <CertificateGeneratorForm
        linkedStudents={linkedStudents}
        defaultHomeschoolName={defaultHomeschoolName}
      />
    </div>
  );
}
