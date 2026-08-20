"use client";

import { getCertificateFileUrl } from "@/lib/certificates/display";

export function CertificateListItem({
  cert,
}: {
  cert: {
    _id: string;
    title: string;
    description?: string;
    issueDate: string | Date;
    filePath: string;
    fileType: string;
    associatedCourse?: string;
    associatedProgram?: string;
    associatedEvent?: string;
  };
}) {
  const association = [cert.associatedCourse, cert.associatedProgram, cert.associatedEvent]
    .filter(Boolean)
    .join(" · ");
  const fileUrl = getCertificateFileUrl(cert.filePath);

  return (
    <li className="rounded-xl border border-explore-charcoal/10 bg-explore-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-semibold text-explore-charcoal">{cert.title}</p>
          {association && <p className="mt-1 text-sm text-explore-charcoal/60">{association}</p>}
          <p className="mt-1 text-xs text-explore-charcoal/50">
            Issued {new Date(cert.issueDate).toLocaleDateString("en-US")}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-explore-teal px-3 py-1.5 text-xs font-semibold text-white"
          >
            View
          </a>
          <a href={fileUrl} download className="rounded-lg border border-explore-charcoal/15 px-3 py-1.5 text-xs font-semibold">
            Download
          </a>
          <button
            type="button"
            onClick={() => window.open(fileUrl, "_blank")?.print()}
            className="rounded-lg border border-explore-charcoal/15 px-3 py-1.5 text-xs font-semibold"
          >
            Print
          </button>
        </div>
      </div>
    </li>
  );
}
