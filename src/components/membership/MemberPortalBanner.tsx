import Link from "next/link";
import { auth } from "@/lib/auth";
import { getParentMembershipAccess, getStudentMembershipAccess } from "@/lib/membership/access";

export async function MemberPortalBanner() {
  const session = await auth();
  if (!session?.user) return null;

  if (session.user.role === "parent") {
    const access = await getParentMembershipAccess(session.user.id);
    if (!access.hasActiveMembership) return null;

    return (
      <div className="mb-8 rounded-2xl border border-explore-teal/25 bg-white p-5 text-center shadow-sm sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-explore-teal">
          {access.planName ?? "Active membership"}
        </p>
        <p className="mt-1 text-explore-charcoal/80">
          Your membership is active. Open your parent dashboard to manage your family account.
        </p>
        <Link
          href="/parent"
          className="mt-4 inline-flex rounded-full bg-explore-teal px-6 py-2.5 text-sm font-semibold text-white hover:bg-explore-teal/90"
        >
          Go to Parent Portal
        </Link>
      </div>
    );
  }

  if (session.user.role === "student") {
    const access = await getStudentMembershipAccess(session.user.id);
    if (!access.hasActiveMembership) return null;

    return (
      <div className="mb-8 rounded-2xl border border-explore-teal/25 bg-white p-5 text-center shadow-sm sm:p-6">
        <p className="text-sm font-semibold uppercase tracking-wide text-explore-teal">
          {access.planName ?? "Active membership"}
        </p>
        <p className="mt-1 text-explore-charcoal/80">
          Your student portal is ready. Continue your learning journey.
        </p>
        <Link
          href="/student"
          className="mt-4 inline-flex rounded-full bg-explore-teal px-6 py-2.5 text-sm font-semibold text-white hover:bg-explore-teal/90"
        >
          Go to Student Portal
        </Link>
      </div>
    );
  }

  return null;
}
