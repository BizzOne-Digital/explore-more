import Link from "next/link";
import { AuthFormShell } from "@/components/forms/AuthFormShell";
import { Button } from "@/components/ui/Button";

type PortalKind = "parent" | "student";

const PORTAL_COPY: Record<
  PortalKind,
  { title: string; subtitle: string; createLabel: string; loginHref: string }
> = {
  parent: {
    title: "Parent Portal",
    subtitle:
      "Access purchased books and courses, message staff, and manage your profile — with or without a membership.",
    createLabel: "Create Free Account",
    loginHref: "/parent/login",
  },
  student: {
    title: "Student Portal",
    subtitle:
      "Access courses, events, resources, and track your learning journey with Explore More Academy.",
    createLabel: "Create Student Account",
    loginHref: "/student/login",
  },
};

export function PortalEntryPage({ portal }: { portal: PortalKind }) {
  const copy = PORTAL_COPY[portal];
  const membershipHref = `/membership?portal=${portal}`;
  const signupHref = portal === "parent" ? "/parent/signup" : membershipHref;

  return (
    <AuthFormShell title={copy.title} subtitle={copy.subtitle}>
      <div className="space-y-4">
        {portal === "parent" ? (
          <>
            <p className="text-center text-sm text-explore-charcoal/70">
              <strong>Free account</strong> — for families who want to buy books or courses without a
              membership. Includes staff messaging and your purchase library.
            </p>
            <Button href={signupHref} size="lg" className="w-full">
              {copy.createLabel}
            </Button>
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-explore-charcoal/10" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-explore-charcoal/50">or</span>
              </div>
            </div>
            <p className="text-center text-sm text-explore-charcoal/70">
              <strong>Membership</strong> — unlock portfolio tracking, student accounts, tutoring,
              resources, and member events.
            </p>
            <Button href={membershipHref} size="lg" variant="secondary" className="w-full">
              View Membership Plans
            </Button>
          </>
        ) : (
          <>
            <p className="text-center text-sm text-explore-charcoal/70">
              Student accounts require an active family membership and a parent link.
            </p>
            <Button href={membershipHref} size="lg" className="w-full">
              {copy.createLabel}
            </Button>
          </>
        )}
        <p className="text-center text-sm text-explore-charcoal/60 pt-2">
          Already have an account?{" "}
          <Link href={copy.loginHref} className="font-medium text-explore-teal hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthFormShell>
  );
}
