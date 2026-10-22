const LESSON_PLAN_KEYS = [
  "title",
  "date",
  "grade",
  "subject",
  "unit",
  "duration",
  "status",
  "planMode",
  "isTemplate",
  "archived",
  "learningObjective",
  "essentialQuestion",
  "materials",
  "warmUp",
  "instruction",
  "assessment",
  "homework",
  "differentiation",
  "reflection",
  "notes",
] as const;

export type LessonPlanFieldKey = (typeof LESSON_PLAN_KEYS)[number];

export function pickLessonPlanFields(body: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of LESSON_PLAN_KEYS) {
    if (body[key] !== undefined) out[key] = body[key];
  }
  if (out.date && typeof out.date === "string") {
    const parsed = new Date(out.date);
    if (!Number.isNaN(parsed.getTime())) out.date = parsed;
  }
  if (out.planMode && out.planMode !== "quick" && out.planMode !== "detailed") {
    delete out.planMode;
  }
  return out;
}

export const QUICK_PLAN_SECTIONS: { key: LessonPlanFieldKey; label: string; rows?: number }[] = [
  { key: "learningObjective", label: "Learning objective", rows: 2 },
  { key: "materials", label: "Materials", rows: 2 },
  { key: "instruction", label: "Instruction", rows: 4 },
  { key: "assessment", label: "Assessment", rows: 2 },
  { key: "homework", label: "Homework", rows: 2 },
];

export const DETAILED_PLAN_SECTIONS: { key: LessonPlanFieldKey; label: string; rows?: number }[] = [
  ...QUICK_PLAN_SECTIONS,
  { key: "essentialQuestion", label: "Essential question", rows: 2 },
  { key: "warmUp", label: "Warm-up", rows: 2 },
  { key: "differentiation", label: "Differentiation", rows: 3 },
  { key: "reflection", label: "Reflection", rows: 2 },
  { key: "notes", label: "Notes", rows: 2 },
];
