import connectDB from "@/lib/db";
import { Result } from "@/models";
import { apiSuccess, apiError, notFound, isValidObjectId } from "@/lib/admin/api";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return notFound();
    await connectDB();
    const item = await Result.findById(id).lean();
    if (!item) return notFound();
    return apiSuccess(item);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return notFound();
    await connectDB();
    const body = await request.json();
    const item = await Result.findByIdAndUpdate(id, body, { new: true, runValidators: true }).lean();
    if (!item) return notFound();
    return apiSuccess(item);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return notFound();
    await connectDB();
    const item = await Result.findByIdAndDelete(id);
    if (!item) return notFound();
    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
