import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import connectDB from "@/lib/db";
import { PortfolioReviewRequest, User } from "@/models";
import { resolveParentContext } from "@/lib/parent/context";
import { PortfolioSubNav } from "@/components/parent/ParentNav";
import { StudentYearSelector } from "@/components/parent/StudentYearSelector";
import { ReviewRequestResponder } from "@/components/parent/ReviewRequestResponder";
import { PORTFOLIO_STATUS_LABELS } from "@/lib/portfolio/constants";

export default async function PortfolioReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ student?: string; year?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/parent/login?callbackUrl=/parent/portfolio/reviews");

  const params = await searchParams;
  const ctx = await resolveParentContext(session.user.id, params);
  if (!ctx.studentId || !ctx.portfolio) redirect("/parent/portfolio");

  await connectDB();
  const requests = await PortfolioReviewRequest.find({ portfolioId: ctx.portfolio._id })
    .populate("requestedBy", "name")
    .sort({ createdAt: -1 });

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold">Portfolio Reviews</h2>
      <Suspense fallback={null}>
        <StudentYearSelector students={ctx.students.map((s) => ({ id: s.id, name: s.name }))} selectedStudentId={ctx.studentId} selectedYear={ctx.schoolYear} />
        <PortfolioSubNav />
      </Suspense>

      <div className="rounded-xl bg-white p-5 shadow-sm">
        <p className="text-sm font-semibold text-explore-charcoal">Portfolio Status</p>
        <p className="mt-1 text-lg font-bold text-explore-teal">{PORTFOLIO_STATUS_LABELS[ctx.portfolio.status]}</p>
        {ctx.portfolio.reviewerNotes && (
          <p className="mt-3 text-sm text-explore-charcoal/70">{ctx.portfolio.reviewerNotes}</p>
        )}
        {ctx.portfolio.submittedAt && (
          <p className="mt-2 text-xs text-explore-charcoal/50">
            Submitted {new Date(ctx.portfolio.submittedAt).toLocaleString()}
          </p>
        )}
      </div>

      <div className="space-y-4">
        {requests.map((req) => {
          const reviewer = req.requestedBy as unknown as InstanceType<typeof User> | null;
          return (
            <div key={req._id.toString()}>
              {req.status === "open" ? (
                <ReviewRequestResponder
                  requestId={req._id.toString()}
                  subject={req.subject}
                  message={req.message}
                />
              ) : (
                <div className="rounded-xl bg-explore-teal/10 p-5 text-sm">
                  <p className="font-semibold">Request fulfilled — {req.subject ?? "General"}</p>
                  <p className="text-explore-charcoal/70">{req.message}</p>
                  <p className="mt-1 text-xs text-explore-charcoal/50">Reviewed by {reviewer?.name ?? "Staff"}</p>
                </div>
              )}
            </div>
          );
        })}
        {requests.length === 0 && (
          <p className="text-sm text-explore-charcoal/60">No reviewer requests at this time.</p>
        )}
      </div>
    </div>
  );
}
