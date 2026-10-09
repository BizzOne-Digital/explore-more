import connectDB from "@/lib/db";
import { AdminDocument, AdminDocumentFolder } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { requireRole } from "@/lib/api/auth-helpers";
import { z } from "zod";

const folderSchema = z.object({
  name: z.string().min(1).max(120),
});

export async function GET() {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    await connectDB();
    const folders = await AdminDocumentFolder.find().sort({ name: 1 }).lean();
    const documents = await AdminDocument.find()
      .sort({ folderId: 1, title: 1 })
      .lean();

    return apiSuccess({ folders, documents });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    const body = folderSchema.parse(await request.json());
    await connectDB();
    const folder = await AdminDocumentFolder.create({ name: body.name.trim() });
    return apiSuccess({ folder }, 201);
  } catch (error) {
    return apiError(error);
  }
}
