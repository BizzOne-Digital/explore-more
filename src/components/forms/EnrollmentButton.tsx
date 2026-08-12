"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface EnrollmentButtonProps {
  courseId: string;
  courseSlug: string;
  courseTitle: string;
  priceCents: number;
  isFree: boolean;
  enrollmentStatus: string;
}

export function EnrollmentButton({
  courseId,
  courseSlug,
  courseTitle,
  priceCents,
  isFree,
  enrollmentStatus,
}: EnrollmentButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const closed = enrollmentStatus === "closed";

  async function handleEnroll() {
    if (!session) {
      setModalOpen(true);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/enrollments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ courseId, courseSlug }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Enrollment failed");

      if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
      } else {
        router.push("/student");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (closed) {
    return (
      <Button variant="outline" disabled>
        Enrollment Closed
      </Button>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <Button onClick={handleEnroll} disabled={loading} size="lg" variant="primary">
          {loading
            ? "Processing..."
            : enrollmentStatus === "waitlist"
              ? "Join Waitlist"
              : isFree || priceCents === 0
                ? "Enroll Free"
                : "Enroll Now"}
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Sign in to enroll">
        <p className="text-sm text-explore-charcoal/70 mb-6">
          Create an account or sign in to enroll in <strong>{courseTitle}</strong>.
        </p>
        <div className="flex flex-col gap-3">
          <Button
            href={`/login?callbackUrl=${encodeURIComponent(`/courses/${courseSlug}`)}`}
            variant="primary"
          >
            Sign In
          </Button>
          <Button
            href={`/register?callbackUrl=${encodeURIComponent(`/courses/${courseSlug}`)}`}
            variant="outline"
          >
            Create Account
          </Button>
          <button
            type="button"
            onClick={() => setModalOpen(false)}
            className="text-sm text-explore-charcoal/50 hover:text-explore-charcoal mt-2"
          >
            Cancel
          </button>
        </div>
      </Modal>
    </>
  );
}
