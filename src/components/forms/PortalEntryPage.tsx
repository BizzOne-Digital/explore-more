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
      "Manage your child's courses, track progress, billing, and stay connected with Explore More Academy.",
    createLabel: "Create Parent Account",
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

  return (
    <AuthFormShell title={copy.title} subtitle={copy.subtitle}>
      <div className="space-y-6">
        <p className="text-center text-sm text-explore-charcoal/70">
          New families start with a membership. Choose a plan, then create your account to unlock
          portal access.
        </p>
        <Button href={membershipHref} size="lg" className="w-full">
          {copy.createLabel}
        </Button>
        <p className="text-center text-sm text-explore-charcoal/60">
          Already have an account?{" "}
          <Link href={copy.loginHref} className="font-medium text-explore-teal hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthFormShell>
  );
}
