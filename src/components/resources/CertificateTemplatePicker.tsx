"use client";

import Image from "next/image";
import { cn } from "@/lib/cn";
import {
  CERTIFICATE_TEMPLATES,
  DEFAULT_CERTIFICATE_TEMPLATE_ID,
  type CertificateTemplateId,
} from "@/lib/resources/certificate-templates";

type CertificateTemplatePickerProps = {
  value: CertificateTemplateId;
  onChange: (templateId: CertificateTemplateId) => void;
};

export function CertificateTemplatePicker({ value, onChange }: CertificateTemplatePickerProps) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-explore-charcoal">Certificate style</p>
        <p className="text-xs text-explore-charcoal/60">
          Choose a design — your student&apos;s details will be placed on the certificate.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CERTIFICATE_TEMPLATES.map((template) => {
          const selected = value === template.id;
          return (
            <button
              key={template.id}
              type="button"
              onClick={() => onChange(template.id)}
              className={cn(
                "group overflow-hidden rounded-xl border text-left transition-all",
                selected
                  ? "border-explore-teal ring-2 ring-explore-teal/30 shadow-md"
                  : "border-explore-charcoal/15 hover:border-explore-teal/40"
              )}
            >
              <div className="relative aspect-[4/3] bg-explore-cream">
                <Image
                  src={template.previewPath}
                  alt={template.name}
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
              </div>
              <div className="px-2 py-2">
                <p className="text-xs font-semibold text-explore-charcoal">{template.name}</p>
                <p className="mt-0.5 line-clamp-2 text-[10px] text-explore-charcoal/55">
                  {template.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export { DEFAULT_CERTIFICATE_TEMPLATE_ID };
