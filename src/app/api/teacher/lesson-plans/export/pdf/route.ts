import { ZipArchive } from "archiver";
import { PassThrough } from "stream";
import connectDB from "@/lib/db";
import { jsonError } from "@/lib/api/response";
import { requireTeacherPortal } from "@/lib/teacher/api-auth";
import { TeacherLessonPlan } from "@/models";
import { currentSchoolYear } from "@/lib/tutor/school-year";
import {
  buildLessonPlanPdfBytes,
  lessonPlanPdfFilename,
} from "@/lib/teacher/lesson-plan-pdf-build";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const sessionResult = await requireTeacherPortal();
  if ("error" in sessionResult) return sessionResult.error;

  await connectDB();
  const teacherId = sessionResult.user.id;
  const schoolYear =
    new URL(request.url).searchParams.get("schoolYear") ?? currentSchoolYear();

  const items = await TeacherLessonPlan.find({ teacherId, schoolYear })
    .sort({ date: -1, updatedAt: -1 })
    .limit(200)
    .lean();

  if (items.length === 0) {
    return jsonError("No lesson plans to export for this school year", 404);
  }

  const archive = new ZipArchive({ zlib: { level: 5 } });
  const passThrough = new PassThrough();
  archive.pipe(passThrough);

  const usedNames = new Set<string>();
  for (const plan of items) {
    const pdf = await buildLessonPlanPdfBytes(teacherId, plan);
    let name = lessonPlanPdfFilename(plan.title);
    if (usedNames.has(name)) {
      name = name.replace(/\.pdf$/i, `-${String(plan._id).slice(-6)}.pdf`);
    }
    usedNames.add(name);
    archive.append(Buffer.from(pdf), { name });
  }

  await archive.finalize();

  const chunks: Buffer[] = [];
  for await (const chunk of passThrough) {
    chunks.push(Buffer.from(chunk));
  }
  const buffer = Buffer.concat(chunks);
  const safeYear = schoolYear.replace(/[^\d-]/g, "") || "export";

  return new Response(buffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="ema-lesson-plans-${safeYear}.zip"`,
    },
  });
}
