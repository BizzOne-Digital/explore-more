import type { CertificateFieldLayout, CertificateTemplateDefinition } from "@/lib/resources/certificate-templates";

export const CERTIFICATE_FIELD_KEYS = [
  "studentName",
  "homeschoolName",
  "achievement",
  "educatorName",
  "dateAwarded",
] as const;

export type CertificateFieldKey = (typeof CERTIFICATE_FIELD_KEYS)[number];

export const CERTIFICATE_FIELD_LABELS: Record<CertificateFieldKey, string> = {
  studentName: "Student name",
  homeschoolName: "Homeschool name",
  achievement: "Grade / course",
  educatorName: "Teacher / parent",
  dateAwarded: "Date completed",
};

export type CertificateFontFamily = "times" | "helvetica" | "courier";

export const CERTIFICATE_FONT_OPTIONS: Array<{ id: CertificateFontFamily; label: string }> = [
  { id: "times", label: "Times New Roman" },
  { id: "helvetica", label: "Arial / Helvetica" },
  { id: "courier", label: "Courier New" },
];

export type CertificateFieldStyle = {
  pageX: number;
  pageY: number;
  fontSize: number;
  fontFamily: CertificateFontFamily;
  align: "left" | "center";
  bold: boolean;
  color?: { r: number; g: number; b: number };
};

export type CertificateFieldStylesMap = Record<CertificateFieldKey, CertificateFieldStyle>;

export function layoutToFieldStyle(
  layout: CertificateFieldLayout,
  key: CertificateFieldKey
): CertificateFieldStyle {
  return {
    pageX: layout.pageX,
    pageY: layout.pageY,
    fontSize: layout.maxSize ?? (key === "studentName" ? 32 : 18),
    fontFamily: "times",
    align: layout.align,
    bold: key === "studentName",
    color: layout.color,
  };
}

export function defaultFieldStylesFromTemplate(
  template: CertificateTemplateDefinition
): CertificateFieldStylesMap {
  return {
    studentName: layoutToFieldStyle(template.layout.studentName, "studentName"),
    homeschoolName: layoutToFieldStyle(template.layout.homeschoolName, "homeschoolName"),
    achievement: layoutToFieldStyle(template.layout.achievement, "achievement"),
    educatorName: layoutToFieldStyle(template.layout.educatorName, "educatorName"),
    dateAwarded: layoutToFieldStyle(template.layout.dateAwarded, "dateAwarded"),
  };
}

export function cssFontFamily(family: CertificateFontFamily): string {
  if (family === "helvetica") return "Arial, Helvetica, sans-serif";
  if (family === "courier") return "'Courier New', Courier, monospace";
  return "'Times New Roman', Times, serif";
}
