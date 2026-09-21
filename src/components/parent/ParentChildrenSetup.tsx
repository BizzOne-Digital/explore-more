"use client";

import { CreateChildForm } from "@/components/parent/CreateChildForm";
import { LinkChildForm } from "@/components/parent/LinkChildForm";

export function ParentChildrenSetup() {
  return (
    <div className="space-y-8">
      <CreateChildForm />
      <div className="relative">
        <div className="absolute inset-0 flex items-center" aria-hidden>
          <div className="w-full border-t border-explore-charcoal/10" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-explore-cream px-3 text-xs font-semibold uppercase tracking-wide text-explore-charcoal/50">
            or link an existing student
          </span>
        </div>
      </div>
      <LinkChildForm />
    </div>
  );
}
