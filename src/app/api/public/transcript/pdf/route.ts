import { z } from "zod";
import { jsonError } from "@/lib/api/response";
import { rateLimit } from "@/lib/api/rate-limit";
import { generateTranscriptPdf } from "@/lib/pdf/transcript-report";

const courseSchema = z.object({
  courseName: z.string().max(120),
  gradePercent: z.string().max(10).optional().default(""),
  letterGrade: z.string().max(4).optional().default(""),
  startDate: z.string().max(20).optional().default(""),
  endDate: z.string().max(20).optional().default(""),
  duration: z.string().max(40).optional().default(""),
  credits: z.string().max(10).optional().default(""),
});

const transcriptSchema = z.object({
  student: z.object({
    studentName: z.string().min(1).max(120),
    dateOfBirth: z.string().max(30).optional().default(""),
    gradeLevel: z.string().max(30).optional().default(""),
    homeschoolName: z.string().max(120).optional().default(""),
    schoolYear: z.string().max(30).optional().default(""),
    curriculumSite: z.string().max(120).optional().default(""),
    streetAddress: z.string().max(200).optional().default(""),
    cityStateZip: z.string().max(120).optional().default(""),
  }),
  courses: z.array(courseSchema).min(1).max(40),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const limit = rateLimit(`transcript-pdf:${ip}`, 15, 60_000);
  if (!limit.ok) {
    return jsonError("Too many requests. Please try again in a minute.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const parsed = transcriptSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  const hasNamedCourse = parsed.data.courses.some((c) => c.courseName.trim());
  if (!hasNamedCourse) {
    return jsonError("Add at least one course with a name.");
  }

  try {
    const pdf = await generateTranscriptPdf(parsed.data.student, parsed.data.courses);
    const safeName = parsed.data.student.studentName.replace(/[^\w.-]+/g, "_").slice(0, 40);
    const filename = `transcript-${safeName || "student"}.pdf`;

    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Transcript PDF error:", error);
    return jsonError("Could not generate transcript PDF.", 500);
  }
}
