import Link from "next/link";
import { AuthFormShell } from "@/components/forms/AuthFormShell";
import { Button } from "@/components/ui/Button";

export const metadata = {
  title: "Tutor Portal",
  description: "Explore More Academy tutor portal sign in.",
};

export default function TutorPortalEntryPage() {
  return (
    <AuthFormShell
      title="Tutor Portal"
      subtitle="Welcome to the Explore More Academy Tutor Portal. Sign in to manage your students, resources, and parent communications."
    >
      <div className="space-y-6">
        <div className="rounded-2xl border border-violet-200 bg-violet-50 p-5 text-center">
          <p className="text-4xl" aria-hidden>
            🧑‍🏫
          </p>
          <p className="mt-2 text-sm text-explore-charcoal/70">
            Tutor accounts are created by Explore More Academy administration. You will receive
            your email login and unique 6-digit Tutor ID.
          </p>
        </div>
        <Button href="/tutor/login" size="lg" className="w-full">
          Tutor Sign In
        </Button>
        <p className="text-center text-sm text-explore-charcoal/60">
          Not a tutor?{" "}
          <Link href="/portal-login" className="font-medium text-explore-teal hover:underline">
            Choose another portal
          </Link>
        </p>
      </div>
    </AuthFormShell>
  );
}
