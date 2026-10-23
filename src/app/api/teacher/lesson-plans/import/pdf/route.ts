import connectDB from "@/lib/db";
import { jsonError, jsonOk } from "@/lib/api/response";
import { requireTeacherPortal } from "@/lib/teacher/api-auth";
import { TeacherLessonPlan } from "@/models";
import { currentSchoolYear } from "@/lib/tutor/school-year";
import { pickLessonPlanFields } from "@/lib/teacher/lesson-plan-fields";
import {
  buildExistingImportKeys,
  lessonPlanImportKey,
} from "@/lib/teacher/lesson-plan-import";
import { syncLessonPlanToPlanner } from "@/lib/teacher/lesson-plan-planner-sync";
import {
  parseLessonPlanPdfText,
  titleFromPdfFilename,
} from "@/lib/teacher/lesson-plan-pdf-import";
export const runtime = "nodejs";

async function extractPdfText(buffer: Buffer) {
  const pdfParse = (await import("pdf-parse")).default;
  return pdfParse(buffer);
}

const MAX_FILES = 25;
const MAX_BYTES = 12 * 1024 * 1024;

export async function POST(request: Request) {
  const sessionResult = await requireTeacherPortal();
  if ("error" in sessionResult) return sessionResult.error;

  const form = await request.formData().catch(() => null);
  if (!form) return jsonError("Expected multipart form with PDF file(s)", 400);

  const files: File[] = [];
  for (const value of form.getAll("files")) {
    if (value instanceof File && value.size > 0) {
      if (!value.type.includes("pdf") && !value.name.toLowerCase().endsWith(".pdf")) {
        return jsonError(`"${value.name}" is not a PDF`, 400);
      }
      if (value.size > MAX_BYTES) {
        return jsonError(`"${value.name}" is too large (max 12MB per file)`, 400);
      }
      files.push(value);
    }
  }

  if (files.length === 0) return jsonError("Upload at least one PDF file", 400);
  if (files.length > MAX_FILES) return jsonError(`Too many files (max ${MAX_FILES})`, 400);

  await connectDB();
  const teacherId = sessionResult.user.id;
  const schoolYear = currentSchoolYear();

  const existing = await TeacherLessonPlan.find({ teacherId, schoolYear })
    .select("title subject grade date")
    .lean();
  const existingKeys = buildExistingImportKeys(existing);
  const batchKeys = new Set<string>();

  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const file of files) {
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const parsed = await extractPdfText(buffer);
      const fallbackTitle = titleFromPdfFilename(file.name);
      const extracted = parseLessonPlanPdfText(parsed.text ?? "", fallbackTitle);

      const raw: Record<string, unknown> = {
        title: extracted.title,
        subject: extracted.subject,
        grade: extracted.grade,
        date: extracted.date,
        planMode: extracted.planMode,
        status: extracted.status,
        ...extracted.fields,
      };

      const key = lessonPlanImportKey(raw);
      if (!key.startsWith("|") && key.length > 1) {
        if (existingKeys.has(key) || batchKeys.has(key)) {
          skipped += 1;
          continue;
        }
        batchKeys.add(key);
      }

      const fields = pickLessonPlanFields({
        title: extracted.title,
        subject: extracted.subject,
        grade: extracted.grade,
        date: extracted.date,
        planMode: extracted.planMode,
        status: "draft",
        ...extracted.fields,
      });

      const doc = await TeacherLessonPlan.create({
        teacherId,
        schoolYear,
        title: extracted.title,
        ...fields,
        isTemplate: false,
        archived: false,
        shareEnabled: false,
      });
      existingKeys.add(key);
      await syncLessonPlanToPlanner(doc);
      imported += 1;
    } catch (e) {
      errors.push(`${file.name}: ${e instanceof Error ? e.message : "Could not read PDF"}`);
    }
  }

  if (imported === 0 && errors.length > 0) {
    return jsonError(errors.join("; "), 400);
  }

  return jsonOk({
    imported,
    skipped,
    errors: errors.length > 0 ? errors : undefined,
  });
}
