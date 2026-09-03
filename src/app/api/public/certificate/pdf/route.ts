import { z } from "zod";
import { jsonError } from "@/lib/api/response";
import { rateLimit } from "@/lib/api/rate-limit";
import { generateCertificatePdf } from "@/lib/pdf/certificate-template";

const certificateSchema = z.object({
  studentName: z.string().min(1).max(120),
  achievement: z.string().min(1).max(200),
  homeschoolName: z.string().max(120).optional().default(""),
  dateAwarded: z.string().min(1).max(60),
});

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const limit = rateLimit(`certificate-pdf:${ip}`, 15, 60_000);
  if (!limit.ok) {
    return jsonError("Too many requests. Please try again in a minute.", 429);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const parsed = certificateSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  try {
    const pdf = await generateCertificatePdf(parsed.data);
    const safeName = parsed.data.studentName.replace(/[^\w.-]+/g, "_").slice(0, 40);
    const filename = `certificate-${safeName || "student"}.pdf`;

    return new Response(Buffer.from(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Certificate PDF error:", error);
    return jsonError("Could not generate certificate PDF.", 500);
  }
}
