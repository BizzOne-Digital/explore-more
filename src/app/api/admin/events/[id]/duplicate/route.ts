import connectDB from "@/lib/db";
import { Event } from "@/models";
import { apiSuccess, apiError, notFound, isValidObjectId } from "@/lib/admin/api";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!isValidObjectId(id)) return notFound();
    
    await connectDB();
    const original = await Event.findById(id).lean();
    if (!original) return notFound();

    // Create a duplicate with modified fields
    const duplicateData = {
      ...original,
      _id: undefined,
      title: `${original.title} (Copy)`,
      slug: `${original.slug}-copy-${Date.now()}`,
      status: "draft" as const,
      publishedToWebsite: false,
      createdAt: undefined,
      updatedAt: undefined,
    };

    const duplicate = await Event.create(duplicateData);
    return apiSuccess(duplicate, 201);
  } catch (error) {
    return apiError(error);
  }
}
