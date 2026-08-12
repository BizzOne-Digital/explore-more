import connectDB from "@/lib/db";
import { Page } from "@/models";
import { apiSuccess, apiError, notFound } from "@/lib/admin/api";

export async function GET(_req: Request, { params }: { params: Promise<{ pageKey: string }> }) {
  try {
    const { pageKey } = await params;
    await connectDB();
    const item = await Page.findOne({ key: pageKey }).lean();
    if (!item) return notFound();
    return apiSuccess(item);
  } catch (error) {
    return apiError(error);
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ pageKey: string }> }) {
  try {
    const { pageKey } = await params;
    await connectDB();
    const body = await request.json();
    const item = await Page.findOneAndUpdate(
      { key: pageKey },
      body,
      { new: true, runValidators: true, upsert: true }
    ).lean();
    return apiSuccess(item);
  } catch (error) {
    return apiError(error);
  }
}
