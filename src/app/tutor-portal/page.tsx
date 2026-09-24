import Link from "next/link";
import { AuthFormShell } from "@/components/forms/AuthFormShell";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Staff Portal",
  description: "Explore More Academy staff portal sign in.",
};

export default function TutorPortalEntryPage() {
  return (
    <AuthFormShell
      title="Staff Portal"
      subtitle="One sign-in for Explore More staff. Tutors open the Tutor Portal (students & parents). School teachers open the Teacher Portal (digital planner & school colleagues)."
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 text-center">
          <p className="text-4xl" aria-hidden>
            🧑‍🏫
          </p>
          <p className="mt-2 text-sm text-explore-charcoal/70">
            Staff accounts are created by Explore More Academy administration. You will receive
            your email login and unique Staff ID (for example STF-… or INS-…).
          </p>
        </div>
        <Button href="/tutor/login" size="lg" className="w-full">
          Staff Sign In
        </Button>
        <p className="text-center text-sm text-explore-charcoal/60">
          Not staff?{" "}
          <Link href="/portal-login" className="font-medium text-explore-teal hover:underline">
            Choose another portal
          </Link>
        </p>
      </div>
    </AuthFormShell>
  );
}
