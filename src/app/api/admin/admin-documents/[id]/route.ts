import connectDB from "@/lib/db";
import { AdminDocument, AdminDocumentFolder } from "@/models";
import { apiSuccess, apiError, isValidObjectId, notFound } from "@/lib/admin/api";
import { requireRole } from "@/lib/api/auth-helpers";
import { deletePrivateStoredFile } from "@/lib/services/private-stored-upload";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  folderId: z.string().min(1).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    const { id } = await params;
    if (!isValidObjectId(id)) return notFound();

    const body = updateSchema.parse(await request.json());
    await connectDB();

    if (body.folderId && !isValidObjectId(body.folderId)) {
      return apiError(new Error("Invalid folder"), 400);
    }
    if (body.folderId) {
      const folder = await AdminDocumentFolder.findById(body.folderId);
      if (!folder) return apiError(new Error("Folder not found"), 404);
    }

    const document = await AdminDocument.findByIdAndUpdate(
      id,
      {
        ...(body.title ? { title: body.title.trim() } : {}),
        ...(body.folderId ? { folderId: body.folderId } : {}),
      },
      { new: true }
    ).lean();

    if (!document) return notFound("Document not found");
    return apiSuccess({ document });
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    const { id } = await params;
    if (!isValidObjectId(id)) return notFound();

    await connectDB();
    const document = await AdminDocument.findById(id);
    if (!document) return notFound("Document not found");

    await deletePrivateStoredFile(document.filePath);
    await AdminDocument.findByIdAndDelete(id);

    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
