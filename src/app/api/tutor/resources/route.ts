import { z } from "zod";
import connectDB from "@/lib/db";
import { jsonOk, jsonError } from "@/lib/api/response";
import { requireTutorPortal } from "@/lib/tutor/api-auth";
import {
  canPublishResourceToStudent,
  getPublishableStudentIds,
} from "@/lib/tutor/permissions";
import { Resource } from "@/models";
import { TUTOR_RESOURCE_TYPES } from "@/lib/tutor/constants";
import mongoose from "mongoose";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(TUTOR_RESOURCE_TYPES),
  url: z.string().optional(),
  filePath: z.string().optional(),
  studentId: z.string().optional(),
  audience: z.enum(["single", "all"]).optional(),
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

  const role = sessionResult.user.role;
  const audience = parsed.data.audience ?? (parsed.data.isPublic ? "all" : "single");

  let assignedStudentIds: string[] = [];
  let isPublic = false;

  if (audience === "all") {
    const publishableIds = await getPublishableStudentIds(sessionResult.user.id, role);
    if (publishableIds.length === 0) {
      return jsonError("No students available to publish to", 400);
    }
    if (role === "administrator") {
      isPublic = true;
    } else {
      assignedStudentIds = publishableIds;
    }
  } else {
    if (!parsed.data.studentId) {
      return jsonError("Please select a student", 400);
    }
    if (
      !(await canPublishResourceToStudent(
        sessionResult.user.id,
        role,
        parsed.data.studentId
      ))
    ) {
      return jsonError("Student not available for publishing", 403);
    }
    assignedStudentIds = [parsed.data.studentId];
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
    isPublic,
    assignedStudentIds: assignedStudentIds.map((id) => new mongoose.Types.ObjectId(id)),
    createdBy: sessionResult.user.id,
  });

  return jsonOk({ resource }, 201);
}
