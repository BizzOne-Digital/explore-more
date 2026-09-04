"use client";

import Image from "next/image";
import { getCertificateTemplate } from "@/lib/resources/certificate-templates";
import type { CertificatePayload } from "@/lib/resources/types";

type CertificateTemplatePreviewProps = {
  form: CertificatePayload;
};

export function CertificateTemplatePreview({ form }: CertificateTemplatePreviewProps) {
  const template = getCertificateTemplate(form.templateId);

  return (
    <div className="relative aspect-[4/3] overflow-hidden rounded-xl border-2 border-explore-teal/30 bg-white shadow-inner">
      <Image
        src={template.previewPath}
        alt={template.name}
        fill
        className="object-cover object-center"
        sizes="(max-width: 1024px) 100vw, 50vw"
        priority
      />
      <div className="pointer-events-none absolute inset-0">
        <p
          className="absolute left-1/2 top-[44%] w-[72%] -translate-x-1/2 -translate-y-1/2 truncate text-center font-bold text-[#142844]"
          style={{ fontSize: "clamp(0.85rem, 2.4vw, 1.35rem)" }}
        >
          {form.studentName.trim() || "Student Name"}
        </p>
        {form.homeschoolName.trim() && (
          <p className="absolute left-[39%] top-[59.5%] max-w-[48%] truncate text-[10px] font-medium text-[#142844] sm:text-xs">
            {form.homeschoolName.trim()}
          </p>
        )}
        {form.achievement.trim() && (
          <p className="absolute left-[39%] top-[64.8%] max-w-[48%] truncate text-[10px] font-medium text-[#142844] sm:text-xs">
            {form.achievement.trim()}
          </p>
        )}
        {form.educatorName?.trim() && (
          <p className="absolute left-[39%] top-[70.1%] max-w-[48%] truncate text-[10px] font-medium text-[#142844] sm:text-xs">
            {form.educatorName.trim()}
          </p>
        )}
        {form.dateAwarded.trim() && (
          <p className="absolute left-[39%] top-[75.4%] max-w-[30%] truncate text-[10px] font-medium text-[#142844] sm:text-xs">
            {form.dateAwarded.trim()}
          </p>
        )}
      </div>
    </div>
  );
}
