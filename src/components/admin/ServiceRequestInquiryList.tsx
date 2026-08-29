"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { formatGradeLabel } from "@/lib/grades";
import { formatDate } from "@/lib/admin/serialize";
import { ServiceRequestStatusSelect } from "@/components/admin/ServiceRequestStatusSelect";

export interface ServiceRequestInquiry {
  _id: string;
  studentName: string;
  parentName: string;
  email: string;
  phone?: string;
  studentAge?: string;
  requestType?: string;
  schoolStatus?: string;
  preferredSchedule?: string;
  goals?: string;
  accessibilityNeeds?: string;
  additionalNotes?: string;
  status: string;
  createdAt: string;
  programId?: { title?: string; grade?: string } | null;
}

const REQUEST_TYPE_LABELS: Record<string, string> = {
  individual: "Individual",
  group: "Group",
};

const SCHOOL_STATUS_LABELS: Record<string, string> = {
  homeschool: "Homeschool",
  traditional: "Traditional school",
  other: "Other",
};

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  if (!value?.trim()) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-white/40">{label}</p>
      <p className="mt-1 text-sm text-white/80 whitespace-pre-wrap">{value}</p>
    </div>
  );
}

function RequestSummary({ request }: { request: ServiceRequestInquiry }) {
  const chips = [
    request.requestType
      ? REQUEST_TYPE_LABELS[request.requestType] ?? request.requestType
      : null,
    request.schoolStatus
      ? SCHOOL_STATUS_LABELS[request.schoolStatus] ?? request.schoolStatus
      : null,
    request.studentAge ? `Age ${request.studentAge}` : null,
  ].filter(Boolean);

  const hasDetails =
    chips.length > 0 ||
    request.preferredSchedule?.trim() ||
    request.goals?.trim() ||
    request.accessibilityNeeds?.trim() ||
    request.additionalNotes?.trim();

  if (!hasDetails) {
    return <p className="text-sm text-white/40">No request details provided.</p>;
  }

  return (
    <div className="space-y-3">
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((chip) => (
            <span
              key={chip}
              className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-xs font-medium text-white/70"
            >
              {chip}
            </span>
          ))}
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <DetailItem label="Preferred schedule" value={request.preferredSchedule} />
        <DetailItem label="Goals & interests" value={request.goals} />
        <DetailItem label="Accessibility needs" value={request.accessibilityNeeds} />
        <DetailItem label="Additional notes" value={request.additionalNotes} />
      </div>
    </div>
  );
}

function InquiryCard({ request }: { request: ServiceRequestInquiry }) {
  const [open, setOpen] = useState(request.status === "new");

  return (
    <article className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start justify-between gap-4 px-4 py-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-white">{request.studentName}</h3>
            <span className="text-white/40">·</span>
            <span className="text-sm text-white/70">{request.parentName}</span>
          </div>
          <p className="text-sm text-white/60">
            {request.programId?.title ?? "Program"} —{" "}
            {request.programId?.grade ? formatGradeLabel(request.programId.grade) : "—"}
          </p>
          <p className="text-xs text-white/40">
            {request.email}
            {request.phone ? ` · ${request.phone}` : ""} · Submitted {formatDate(request.createdAt)}
          </p>
          {!open && request.goals?.trim() && (
            <p className="line-clamp-2 text-sm text-white/50 pt-1">
              <span className="font-medium text-white/60">Interested in: </span>
              {request.goals}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <div onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
            <ServiceRequestStatusSelect id={request._id} status={request.status} />
          </div>
          <ChevronDown
            className={cn("h-4 w-4 text-white/40 transition-transform", open && "rotate-180")}
          />
        </div>
      </button>

      {open && (
        <div className="border-t border-white/10 bg-white/[0.02] px-4 py-4">
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-widest text-explore-lime">
            What they&apos;re requesting
          </h4>
          <RequestSummary request={request} />
        </div>
      )}
    </article>
  );
}

export function ServiceRequestInquiryList({
  data,
  emptyMessage = "No service requests found.",
}: {
  data: ServiceRequestInquiry[];
  emptyMessage?: string;
}) {
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 bg-white/5 px-6 py-12 text-center text-white/50">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {data.map((request) => (
        <InquiryCard key={request._id} request={request} />
      ))}
    </div>
  );
}
