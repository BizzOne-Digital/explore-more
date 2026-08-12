import { z } from "zod";
import connectDB from "@/lib/db";
import { Program, ServiceRequest } from "@/models";
import { queueEmail, emailTemplates } from "@/lib/services/email";
import { jsonOk, jsonError } from "@/lib/api/response";
import { rateLimit } from "@/lib/api/rate-limit";

const requestSchema = z.object({
  parentName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(7),
  studentName: z.string().min(1),
  studentAge: z.string().optional(),
  preferredSchedule: z.string().optional(),
  requestType: z.enum(["individual", "group"]).default("individual"),
  schoolStatus: z.enum(["homeschool", "traditional", "other"]).optional(),
  goals: z.string().max(2000).optional(),
  accessibilityNeeds: z.string().max(1000).optional(),
  additionalNotes: z.string().max(2000).optional(),
  consentGiven: z.literal(true),
});

type RouteContext = { params: Promise<{ slug: string }> };

export async function POST(request: Request, context: RouteContext) {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const limit = rateLimit(`service-request:${ip}`, 5, 60_000);
  if (!limit.ok) {
    return jsonError("Too many requests. Please try again later.", 429);
  }

  const { slug } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body");
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(parsed.error.errors[0]?.message ?? "Invalid input");
  }

  await connectDB();

  const program = await Program.findOne({ slug, status: "published" });

  if (!program) {
    return jsonError("Program not found", 404);
  }

  const serviceRequest = await ServiceRequest.create({
    programId: program._id,
    programSlug: program.slug,
    ...parsed.data,
    status: "new",
  });

  const template = emailTemplates.serviceRequest(parsed.data.parentName, program.title);

  await queueEmail({
    to: parsed.data.email,
    subject: template.subject,
    htmlBody: template.html,
    template: "serviceRequest",
    metadata: { requestId: serviceRequest._id.toString() },
  });

  return jsonOk(
    {
      message: "Service request submitted successfully",
      requestId: serviceRequest._id.toString(),
    },
    201
  );
}
