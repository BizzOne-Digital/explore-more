"use client";

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
    <div
      className="relative aspect-[1024/790] w-full overflow-hidden rounded-xl border-2 border-explore-teal/30 bg-white shadow-inner [container-type:inline-size]"
    >
      <div
        className="absolute inset-0 bg-center bg-no-repeat"
        style={{
          backgroundImage: `url(${template.previewPath})`,
          backgroundSize: "100% 100%",
        }}
        role="img"
        aria-label={template.name}
      />
      <div className="pointer-events-none absolute inset-0">
        <p
          className="absolute truncate font-serif font-bold"
          style={{
            ...layoutToPreviewStyle(layout.studentName),
            color: fieldColor(layout.studentName),
          }}
        >
          {form.studentName.trim() || "Student Name"}
        </p>
        {form.homeschoolName.trim() && (
          <p
            className="absolute truncate font-serif font-medium"
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
            className="absolute truncate font-serif font-medium"
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
            className="absolute truncate font-serif font-medium"
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
            className="absolute truncate font-serif font-medium"
            style={{
              ...layoutToPreviewStyle(layout.dateAwarded, { maxWidthPercent: 35 }),
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
