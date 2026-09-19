import connectDB from "@/lib/db";
import { GalleryCategory } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function GET() {
  try {
    await connectDB();
    const items = await GalleryCategory.find().sort({ order: 1, name: 1 }).lean();
    return apiSuccess(items);
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await connectDB();
    const body = await request.json();
    const name = String(body.name ?? "").trim();
    if (!name) {
      return apiError(new Error("Name is required"), 400);
    }

    const slug = String(body.slug ?? "").trim() || slugify(name);
    const item = await GalleryCategory.create({
      name,
      slug,
      description: body.description ? String(body.description).trim() : undefined,
      order: Number(body.order) || 0,
    });
    return apiSuccess(item, 201);
  } catch (error) {
    return apiError(error);
  }
}
