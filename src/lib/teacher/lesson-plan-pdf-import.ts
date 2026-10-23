import {
  DETAILED_PLAN_SECTIONS,
  QUICK_PLAN_SECTIONS,
  type LessonPlanFieldKey,
} from "@/lib/teacher/lesson-plan-fields";

const LABEL_TO_KEY = new Map<string, LessonPlanFieldKey>();
for (const s of [...QUICK_PLAN_SECTIONS, ...DETAILED_PLAN_SECTIONS]) {
  LABEL_TO_KEY.set(s.label.toLowerCase(), s.key);
}

const ORDERED_LABELS = [...DETAILED_PLAN_SECTIONS].map((s) => s.label);

export function titleFromPdfFilename(fileName: string) {
  const base = fileName.replace(/\.pdf$/i, "").trim();
  const stripped = base.replace(/^lesson-plan[-_]/i, "").replace(/_/g, " ").trim();
  return stripped || "Imported lesson plan";
}

/** Best-effort parse of text extracted from an EMA lesson plan PDF (or similar layout). */
export function parseLessonPlanPdfText(text: string, fallbackTitle: string) {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ");
  const lines = normalized.split("\n").map((l) => l.trim()).filter(Boolean);

  let title = fallbackTitle;
  const titleIdx = lines.findIndex((l) => l.length > 2 && l.length < 200);
  if (titleIdx >= 0 && !/^status$/i.test(lines[titleIdx])) {
    const candidate = lines[titleIdx];
    if (!ORDERED_LABELS.some((label) => label.toLowerCase() === candidate.toLowerCase())) {
      title = candidate;
    }
  }

  let subject: string | undefined;
  let grade: string | undefined;
  let date: string | undefined;
  const subtitleLine = lines.find((l) => l.includes("·"));
  if (subtitleLine) {
    const parts = subtitleLine.split("·").map((p) => p.trim());
    if (parts[0]) subject = parts[0];
    if (parts[1]) grade = parts[1];
    if (parts[2]) {
      const parsed = new Date(parts[2]);
      if (!Number.isNaN(parsed.getTime())) date = parsed.toISOString().slice(0, 10);
    }
  }

  let planMode: "quick" | "detailed" = "quick";
  const planTypeLine = lines.find((l) => /^plan type/i.test(l) || /^detailed$/i.test(l) || /^quick$/i.test(l));
  if (planTypeLine?.toLowerCase().includes("detailed")) planMode = "detailed";

  const fields: Partial<Record<LessonPlanFieldKey, string>> = {};
  const lower = normalized.toLowerCase();

  for (const label of ORDERED_LABELS) {
    const key = LABEL_TO_KEY.get(label.toLowerCase());
    if (!key) continue;
    const marker = label.toLowerCase();
    const start = lower.indexOf(marker);
    if (start < 0) continue;

    const afterLabel = normalized.slice(start + label.length).replace(/^[\s:\-]+/, "");
    let end = afterLabel.length;
    for (const next of ORDERED_LABELS) {
      if (next.toLowerCase() === marker) continue;
      const nextPos = afterLabel.toLowerCase().indexOf(next.toLowerCase());
      if (nextPos > 0 && nextPos < end) end = nextPos;
    }
    const body = afterLabel.slice(0, end).trim();
    if (body) fields[key] = body;
  }

  const hasDetailed = Boolean(fields.essentialQuestion || fields.warmUp || fields.differentiation);
  if (hasDetailed) planMode = "detailed";

  if (!fields.instruction && normalized.length > 0) {
    const chunk = normalized.slice(0, 8000).trim();
    if (Object.keys(fields).length === 0) {
      fields.notes = chunk;
    }
  }

  return {
    title,
    subject,
    grade,
    date,
    planMode,
    status: "draft" as const,
    fields,
  };
}
