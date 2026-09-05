"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { getCertificateTemplate } from "@/lib/resources/certificate-templates";
import {
  CERTIFICATE_FIELD_KEYS,
  CERTIFICATE_FIELD_LABELS,
  CERTIFICATE_FONT_OPTIONS,
  cssFontFamily,
  defaultFieldStylesFromTemplate,
  type CertificateFieldKey,
  type CertificateFieldStyle,
  type CertificateFieldStylesMap,
} from "@/lib/resources/certificate-fields";
import type { CertificatePayload } from "@/lib/resources/types";

type CertificateInteractiveEditorProps = {
  form: CertificatePayload;
  fieldStyles: CertificateFieldStylesMap;
  onFieldStylesChange: (styles: CertificateFieldStylesMap) => void;
};

function fieldColor(style: CertificateFieldStyle): string {
  if (!style.color) return "#142844";
  const { r, g, b } = style.color;
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

function fieldText(form: CertificatePayload, key: CertificateFieldKey): string {
  switch (key) {
    case "studentName":
      return form.studentName.trim() || "Student Name";
    case "homeschoolName":
      return form.homeschoolName.trim();
    case "achievement":
      return form.achievement.trim();
    case "educatorName":
      return form.educatorName?.trim() || "";
    case "dateAwarded":
      return form.dateAwarded.trim();
  }
}

export function CertificateInteractiveEditor({
  form,
  fieldStyles,
  onFieldStylesChange,
}: CertificateInteractiveEditorProps) {
  const template = getCertificateTemplate(form.templateId);
  const containerRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<CertificateFieldKey | null>("studentName");
  const [dragging, setDragging] = useState<CertificateFieldKey | null>(null);

  const updateField = useCallback(
    (key: CertificateFieldKey, patch: Partial<CertificateFieldStyle>) => {
      onFieldStylesChange({
        ...fieldStyles,
        [key]: { ...fieldStyles[key], ...patch },
      });
    },
    [fieldStyles, onFieldStylesChange]
  );

  const resetField = (key: CertificateFieldKey) => {
    const defaults = defaultFieldStylesFromTemplate(template);
    updateField(key, defaults[key]);
  };

  const resetAll = () => {
    onFieldStylesChange(defaultFieldStylesFromTemplate(template));
  };

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      if (!dragging || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pageX = Math.min(0.98, Math.max(0.02, (e.clientX - rect.left) / rect.width));
      const pageY = Math.min(0.98, Math.max(0.02, (e.clientY - rect.top) / rect.height));
      updateField(dragging, { pageX, pageY });
    }

    function onPointerUp() {
      setDragging(null);
    }

    if (dragging) {
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", onPointerUp);
    }

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [dragging, updateField]);

  const selectedStyle = selected ? fieldStyles[selected] : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-explore-charcoal/70">
          Click a field, then drag it on the certificate. Adjust font and size below.
        </p>
        <button
          type="button"
          onClick={resetAll}
          className="inline-flex items-center gap-1.5 rounded-lg border border-explore-charcoal/15 px-3 py-1.5 text-xs font-medium text-explore-charcoal hover:bg-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset all positions
        </button>
      </div>

      <div
        ref={containerRef}
        className="relative aspect-[1024/790] w-full touch-none select-none overflow-hidden rounded-xl border-2 border-explore-teal/30 bg-white shadow-inner [container-type:inline-size]"
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
        {CERTIFICATE_FIELD_KEYS.map((key) => {
          const text = fieldText(form, key);
          if (!text) return null;
          const style = fieldStyles[key];
          const isSelected = selected === key;
          const left = style.pageX * 100;
          const top = style.pageY * 100;
          const fontSize = `${(style.fontSize / 1024) * 100}cqw`;

          return (
            <button
              key={key}
              type="button"
              onPointerDown={(e) => {
                e.preventDefault();
                setSelected(key);
                setDragging(key);
              }}
              onClick={() => setSelected(key)}
              className={`absolute max-w-[55%] cursor-move rounded px-1 py-0.5 text-left transition-shadow ${
                isSelected
                  ? "ring-2 ring-explore-teal ring-offset-1 ring-offset-transparent"
                  : "hover:ring-1 hover:ring-explore-teal/50"
              }`}
              style={{
                left: `${left}%`,
                top: `${top}%`,
                transform:
                  style.align === "center"
                    ? "translate(-50%, -0.78em)"
                    : "translateY(-0.78em)",
                fontSize,
                fontFamily: cssFontFamily(style.fontFamily),
                fontWeight: style.bold ? 700 : 500,
                color: fieldColor(style),
                lineHeight: 1,
              }}
            >
              <span className="whitespace-nowrap">{text}</span>
            </button>
          );
        })}
      </div>

      {selected && selectedStyle && (
        <div className="rounded-xl border border-explore-charcoal/10 bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-explore-charcoal">
            Edit: {CERTIFICATE_FIELD_LABELS[selected]}
          </p>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="font-medium text-explore-charcoal/80">Font</span>
              <select
                value={selectedStyle.fontFamily}
                onChange={(e) =>
                  updateField(selected, {
                    fontFamily: e.target.value as CertificateFieldStyle["fontFamily"],
                  })
                }
                className="mt-1 w-full rounded-lg border border-explore-charcoal/15 px-3 py-2 text-sm"
              >
                {CERTIFICATE_FONT_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-explore-charcoal/80">
                Size ({selectedStyle.fontSize}pt)
              </span>
              <input
                type="range"
                min={10}
                max={48}
                value={selectedStyle.fontSize}
                onChange={(e) => updateField(selected, { fontSize: Number(e.target.value) })}
                className="mt-2 w-full"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={selectedStyle.bold}
                onChange={(e) => updateField(selected, { bold: e.target.checked })}
              />
              <span className="font-medium text-explore-charcoal/80">Bold</span>
            </label>
            <label className="block text-sm">
              <span className="font-medium text-explore-charcoal/80">Alignment</span>
              <select
                value={selectedStyle.align}
                onChange={(e) =>
                  updateField(selected, { align: e.target.value as "left" | "center" })
                }
                className="mt-1 w-full rounded-lg border border-explore-charcoal/15 px-3 py-2 text-sm"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
              </select>
            </label>
          </div>
          <button
            type="button"
            onClick={() => resetField(selected)}
            className="mt-3 text-xs font-medium text-explore-teal hover:underline"
          >
            Reset this field to default position
          </button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {CERTIFICATE_FIELD_KEYS.map((key) => {
          const text = fieldText(form, key);
          if (!text) return null;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected(key)}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                selected === key
                  ? "bg-explore-teal text-white"
                  : "bg-explore-charcoal/10 text-explore-charcoal hover:bg-explore-charcoal/15"
              }`}
            >
              {CERTIFICATE_FIELD_LABELS[key]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
