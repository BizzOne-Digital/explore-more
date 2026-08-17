"use client";

import { useState } from "react";
import { X, UserPlus, Upload, CheckCircle } from "lucide-react";
import Link from "next/link";

export function QuickStartGuide() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="rounded-xl bg-gradient-to-r from-explore-teal to-explore-forest p-6 text-white shadow-lg">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-display text-xl font-bold mb-2">
            👋 Welcome to Your Parent Portal!
          </h3>
          <p className="text-white/90 text-sm">
            Get started with these quick steps to access all features
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-white/20 rounded transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {/* Step 1 */}
        <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-white/70">Step 1</p>
              <p className="font-semibold">Link a Student</p>
            </div>
          </div>
          <p className="text-sm text-white/80 mb-3">
            Contact admin to link your child(ren) to your account
          </p>
          <Link
            href="/parent/students"
            className="inline-block text-xs font-semibold text-white underline hover:no-underline"
          >
            View Students →
          </Link>
        </div>

        {/* Step 2 */}
        <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <Upload className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-white/70">Step 2</p>
              <p className="font-semibold">Upload Work</p>
            </div>
          </div>
          <p className="text-sm text-white/80 mb-3">
            Start building your homeschool portfolio
          </p>
          <Link
            href="/parent/portfolio"
            className="inline-block text-xs font-semibold text-white underline hover:no-underline"
          >
            Open Portfolio →
          </Link>
        </div>

        {/* Step 3 */}
        <div className="rounded-lg bg-white/10 p-4 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs text-white/70">Step 3</p>
              <p className="font-semibold">Track Progress</p>
            </div>
          </div>
          <p className="text-sm text-white/80 mb-3">
            Monitor completion and submit for review
          </p>
          <Link
            href="/parent/portfolio"
            className="inline-block text-xs font-semibold text-white underline hover:no-underline"
          >
            Check Progress →
          </Link>
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-white/10 p-3">
        <p className="text-xs text-white/90">
          <strong>Need Help?</strong> Contact us at{" "}
          <a href="mailto:chris@exploremoreacademy.com" className="underline">
            chris@exploremoreacademy.com
          </a>
        </p>
      </div>
    </div>
  );
}
