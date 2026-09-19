import connectDB from "@/lib/db";
import { GalleryCategory } from "@/models";
import { apiSuccess, apiError, isValidObjectId } from "@/lib/admin/api";

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) {
      return apiError(new Error("Invalid category id"), 400);
    }

    await connectDB();
    const deleted = await GalleryCategory.findByIdAndDelete(id);
    if (!deleted) {
      return apiError(new Error("Category not found"), 404);
    }

    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
