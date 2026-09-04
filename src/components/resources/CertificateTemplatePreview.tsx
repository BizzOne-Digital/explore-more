"use client";

import Image from "next/image";
import { getCertificateTemplate } from "@/lib/resources/certificate-templates";
import { layoutToPreviewStyle } from "@/lib/resources/certificate-layout";
import type { CertificatePayload } from "@/lib/resources/types";

type CertificateTemplatePreviewProps = {
  form: CertificatePayload;
};

function fieldColor(layout: { color?: { r: number; g: number; b: number } }) {
  if (!layout.color) return "#142844";
  const { r, g, b } = layout.color;
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

export function CertificateTemplatePreview({ form }: CertificateTemplatePreviewProps) {
  const template = getCertificateTemplate(form.templateId);
  const { layout } = template;

  return (
    <div className="relative aspect-[1024/790] overflow-hidden rounded-xl border-2 border-explore-teal/30 bg-white shadow-inner">
      <Image
        src={template.previewPath}
        alt={template.name}
        fill
        className="object-contain object-center"
        sizes="(max-width: 1024px) 100vw, 50vw"
        priority
        unoptimized
      />
      <div className="pointer-events-none absolute inset-0">
        <p
          className="absolute truncate font-bold"
          style={{
            ...layoutToPreviewStyle(layout.studentName),
            color: fieldColor(layout.studentName),
            fontSize: "clamp(0.9rem, 2.6vw, 1.5rem)",
          }}
        >
          {form.studentName.trim() || "Student Name"}
        </p>
        {form.homeschoolName.trim() && (
          <p
            className="absolute truncate text-[10px] font-medium sm:text-xs"
            style={{
              ...layoutToPreviewStyle(layout.homeschoolName),
              color: fieldColor(layout.homeschoolName),
            }}
          >
            {form.homeschoolName.trim()}
          </p>
        )}
        {form.achievement.trim() && (
          <p
            className="absolute truncate text-[10px] font-medium sm:text-xs"
            style={{
              ...layoutToPreviewStyle(layout.achievement),
              color: fieldColor(layout.achievement),
            }}
          >
            {form.achievement.trim()}
          </p>
        )}
        {form.educatorName?.trim() && (
          <p
            className="absolute truncate text-[10px] font-medium sm:text-xs"
            style={{
              ...layoutToPreviewStyle(layout.educatorName),
              color: fieldColor(layout.educatorName),
            }}
          >
            {form.educatorName.trim()}
          </p>
        )}
        {form.dateAwarded.trim() && (
          <p
            className="absolute truncate text-[10px] font-medium sm:text-xs"
            style={{
              ...layoutToPreviewStyle(layout.dateAwarded, { maxWidthPercent: 32 }),
              color: fieldColor(layout.dateAwarded),
            }}
          >
            {form.dateAwarded.trim()}
          </p>
        )}
      </div>
    </div>
  );
}
