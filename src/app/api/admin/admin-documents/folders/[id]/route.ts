import connectDB from "@/lib/db";
import { AdminDocument, AdminDocumentFolder } from "@/models";
import { apiSuccess, apiError, isValidObjectId, notFound } from "@/lib/admin/api";
import { requireRole } from "@/lib/api/auth-helpers";
import { deletePrivateStoredFile } from "@/lib/services/private-stored-upload";

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
    const folder = await AdminDocumentFolder.findById(id);
    if (!folder) return notFound("Folder not found");

    const docs = await AdminDocument.find({ folderId: id });
    for (const doc of docs) {
      await deletePrivateStoredFile(doc.filePath);
    }
    await AdminDocument.deleteMany({ folderId: id });
    await AdminDocumentFolder.findByIdAndDelete(id);

    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
