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
      { $set: { ...body, key: pageKey } },
      {
        new: true,
        runValidators: true,
        upsert: true,
        setDefaultsOnInsert: true,
      }
    ).lean();
    return apiSuccess(item);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ pageKey: string }> }) {
  try {
    const { pageKey } = await params;
    await connectDB();
    const body = await request.json();

    if (typeof body.navVisible !== "boolean") {
      return apiError(new Error("navVisible must be a boolean"), 400);
    }

    const title =
      pageKey.charAt(0).toUpperCase() + pageKey.slice(1).replace(/-/g, " ");

    const item = await Page.findOneAndUpdate(
      { key: pageKey },
      {
        $set: { navVisible: body.navVisible },
        $setOnInsert: {
          key: pageKey,
          title,
          slug: pageKey === "home" ? "home" : pageKey,
          status: "draft",
          sections: [],
        },
      },
      { new: true, runValidators: true, upsert: true }
    ).lean();

    return apiSuccess(item);
  } catch (error) {
    return apiError(error);
  }
}
