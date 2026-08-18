import Link from "next/link";
import { auth } from "@/lib/auth";
import { BillingClient } from "@/components/parent/BillingClient";

export default async function ParentBillingPage() {
  const session = await auth();

  if (session?.user?.role === "administrator") {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="font-display text-2xl font-bold">Billing & Subscription</h2>
          <p className="mt-1 text-sm text-explore-charcoal/70">
            View and update billing details, payment method, subscription plan, and payment history.
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-950">
          <p className="font-semibold">You are signed in as an administrator.</p>
          <p className="mt-2">
            This page loads data from the <strong>parent</strong> account API. Administrators can
            open the parent portal layout, but billing details must be viewed either by signing in as
            a parent or from the admin parent account dashboard.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/parent/login?callbackUrl=/parent/billing"
              className="rounded-lg bg-explore-teal px-4 py-2 font-medium text-white hover:bg-explore-teal/90"
            >
              Sign in as parent
            </Link>
            <Link
              href="/admin/users"
              className="rounded-lg border border-amber-300 bg-white px-4 py-2 font-medium text-amber-950 hover:bg-amber-100"
            >
              Admin → Users → Parent account
            </Link>
          </div>
          <p className="mt-4 text-xs text-amber-800">
            Demo parent: <span className="font-mono">parent@exploremoreacademy.com</span> /{" "}
            <span className="font-mono">ChangeMe123!</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">Billing & Subscription</h2>
        <p className="mt-1 text-sm text-explore-charcoal/70">
          View and update your billing details, payment method, subscription plan, and payment
          history. Card numbers are never stored in full — only the card type and last four digits
          are shown.
        </p>
      </div>
      <BillingClient />
    </div>
  );
}
