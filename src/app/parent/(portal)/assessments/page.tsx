import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  ParentAssessmentsClient,
  type ParentAssessmentItem,
} from "@/components/parent/ParentAssessmentsClient";
import { getAssessmentsForParent } from "@/lib/assessments/queries";

export default async function ParentAssessmentsPage() {
  const session = await auth();
  if (!session?.user) redirect("/parent/login?callbackUrl=/parent/assessments");

  const items = (await getAssessmentsForParent(session.user.id)) as ParentAssessmentItem[];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-explore-charcoal">Assessments</h2>
        <p className="mt-1 text-explore-charcoal/70">
          Download assessments for your children, complete them, and resubmit the PDF.
        </p>
      </div>
      <ParentAssessmentsClient items={items} />
    </div>
  );
}
