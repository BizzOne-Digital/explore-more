"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle, Loader } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function MembershipSuccessClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(!!sessionId);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!sessionId) return;

    void (async () => {
      try {
        const res = await fetch(`/api/membership/session?session_id=${encodeURIComponent(sessionId)}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not load checkout session");
        setEmail(json.email || "");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    })();
  }, [sessionId]);

  const signupHref = email
    ? `/parent/signup?email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent("/parent")}`
    : `/parent/signup?callbackUrl=${encodeURIComponent("/parent")}`;

  const studentSignupHref = email
    ? `/student/signup?parentEmail=${encodeURIComponent(email)}`
    : "/student/signup";

  const loginHref = email
    ? `/parent/login?email=${encodeURIComponent(email)}&callbackUrl=${encodeURIComponent("/parent")}`
    : `/parent/login?callbackUrl=${encodeURIComponent("/parent")}`;

  return (
    <section className="flex min-h-[70vh] w-full items-center justify-center overflow-x-clip bg-explore-cream pt-28 pb-16">
      <div className="w-full min-w-0 max-w-lg px-3 text-center sm:px-4">
        {loading ? (
          <div className="space-y-3">
            <Loader className="mx-auto h-10 w-10 animate-spin text-explore-teal" />
            <p className="text-sm text-explore-charcoal/70">Confirming your membership…</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-explore-charcoal/10 bg-white p-8 shadow-sm">
            <CheckCircle className="mx-auto h-14 w-14 text-explore-teal" />
            <h1 className="mt-4 font-display text-2xl font-bold text-explore-charcoal">
              Welcome to Explore More Academy!
            </h1>
            <p className="mt-3 text-sm text-explore-charcoal/70">
              Your membership payment was successful. Create your parent account to access your
              dashboard, billing, and member benefits.
            </p>
            {email && (
              <p className="mt-2 text-sm text-explore-charcoal/80">
                Use the same email from checkout: <strong>{email}</strong>
              </p>
            )}
            {error && <p className="mt-3 text-sm text-amber-700">{error}</p>}
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button href={signupHref} size="lg">
                Create Parent Account
              </Button>
              <Button href={studentSignupHref} variant="outline" size="lg">
                Create Student Account
              </Button>
            </div>
            <div className="mt-3">
              <Button href={loginHref} variant="ghost" size="lg" className="w-full">
                I Already Have a Parent Account
              </Button>
            </div>
            <p className="mt-6 text-xs text-explore-charcoal/50">
              After creating your parent account, you can open the{" "}
              <Link href="/parent" className="text-explore-teal hover:underline">
                Parent Portal
              </Link>
              .
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
