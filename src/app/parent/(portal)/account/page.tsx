import Link from "next/link";
import { ParentAccountForm } from "@/components/parent/ParentAccountForm";

export default function ParentAccountPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl font-bold">My Profile / Account Settings</h2>
        <p className="mt-1 text-sm text-explore-charcoal/70">
          Update your contact information, emergency contacts, notification preferences, and password.
        </p>
        <p className="mt-2 text-sm">
          <Link href="/parent/billing" className="font-medium text-explore-teal hover:underline">
            Billing address &amp; payment method →
          </Link>
        </p>
      </div>
      <ParentAccountForm />
    </div>
  );
}
