import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ParentSignupForm } from "@/components/forms/ParentSignupForm";
import { canOpenParentSignup } from "@/lib/membership/signup-access";

export const metadata: Metadata = {
  title: "Parent Sign Up",
  description: "Create your parent account to manage your child's learning journey.",
};

export default async function ParentSignupPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const session = await auth();
  const email = params.email ?? session?.user?.email ?? null;
  const allowed = await canOpenParentSignup(email, session?.user?.id);

  if (!allowed) {
    redirect("/membership?reason=signup-required");
  }

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="font-display text-xl font-bold text-explore-charcoal">Parent Registration</h1>
        <p className="mt-2 text-sm text-explore-charcoal/60">
          Create your parent account to manage your child&apos;s courses, track progress, and stay
          connected.
        </p>
      </div>
      <Suspense fallback={<p className="text-center text-sm text-explore-charcoal/50">Loading...</p>}>
        <ParentSignupForm />
      </Suspense>
    </div>
  );
}
