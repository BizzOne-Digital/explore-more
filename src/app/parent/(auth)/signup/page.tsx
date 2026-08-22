import type { Metadata } from "next";
import { Suspense } from "react";
import { ParentSignupForm } from "@/components/forms/ParentSignupForm";

export const metadata: Metadata = {
  title: "Parent Sign Up",
  description: "Create your parent account to manage your child's learning journey.",
};

export default function ParentSignupPage() {
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
