import connectDB from "@/lib/db";
import { auth } from "@/lib/auth";
import { UserDocument } from "@/models";
import { apiSuccess, apiError, isValidObjectId } from "@/lib/admin/api";
import { deletePrivateStoredFile } from "@/lib/services/private-stored-upload";

type RouteParams = { params: Promise<{ id: string; docId: string }> };

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const session = await auth();
    if (!session?.user?.id) return apiError(new Error("Unauthorized"), 401);

    const { id, docId } = await params;
    if (!isValidObjectId(id) || !isValidObjectId(docId)) {
      return apiError(new Error("Invalid id"), 400);
    }

    await connectDB();
    const document = await UserDocument.findOne({ _id: docId, userId: id });
    if (!document) return apiError(new Error("Document not found"), 404);

    await deletePrivateStoredFile(document.path);
    await document.deleteOne();

    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
