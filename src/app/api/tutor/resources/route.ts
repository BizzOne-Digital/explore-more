import { z } from "zod";
import connectDB from "@/lib/db";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireTutorPortal } from "@/lib/tutor/api-auth";
import { tutorHasStudentAccess } from "@/lib/tutor/permissions";
import { Resource } from "@/models";
import { TUTOR_RESOURCE_TYPES } from "@/lib/tutor/constants";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(TUTOR_RESOURCE_TYPES),
  url: z.string().optional(),
  filePath: z.string().optional(),
  studentId: z.string().optional(),
  isPublic: z.boolean().optional(),
});

export async function GET(request: Request) {
  const sessionResult = await requireTutorPortal();
  if ("error" in sessionResult) return sessionResult.error;

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");

  await connectDB();

  if (scope === "academy") {
    const resources = await Resource.find({ isPublic: true })
      .populate("createdBy", "name")
      .sort({ createdAt: -1 })
      .lean();
    return jsonOk({ resources });
  }

  const resources = await Resource.find({ createdBy: sessionResult.user.id })
    .sort({ createdAt: -1 })
    .lean();

  return jsonOk({ resources });
}

export async function POST(request: Request) {
  const sessionResult = await requireTutorPortal();
  if ("error" in sessionResult) return sessionResult.error;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return jsonError("Invalid resource data", 400);

  if (parsed.data.studentId) {
    if (!(await tutorHasStudentAccess(sessionResult.user.id, parsed.data.studentId))) {
      return jsonError("Student not assigned to you", 403);
    }
  }

  if (!parsed.data.url && !parsed.data.filePath) {
    return jsonError("A file or link is required", 400);
  }

  await connectDB();

  const resource = await Resource.create({
    title: parsed.data.title,
    description: parsed.data.description,
    type: parsed.data.type,
    url: parsed.data.url,
    filePath: parsed.data.filePath,
    isPublic: parsed.data.isPublic ?? false,
    assignedStudentIds: parsed.data.studentId ? [parsed.data.studentId] : [],
    createdBy: sessionResult.user.id,
  });

  return jsonOk({ resource }, 201);
}
