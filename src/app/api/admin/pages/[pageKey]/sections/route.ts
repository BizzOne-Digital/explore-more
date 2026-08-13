import connectDB from "@/lib/db";
import { Page } from "@/models";
import { PAGE_KEYS, type PageKey } from "@/lib/constants";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { setPageSectionVisibility } from "@/lib/queries/pages";

export async function GET(_req: Request, { params }: { params: Promise<{ pageKey: string }> }) {
  try {
    const { pageKey } = await params;
    if (!PAGE_KEYS.includes(pageKey as PageKey)) {
      return apiError(new Error("Invalid page key"), 400);
    }

    await connectDB();
    const page = await Page.findOne({ key: pageKey }).select("sections").lean();

    return apiSuccess(page?.sections ?? []);
  } catch (error) {
    return apiError(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ pageKey: string }> }) {
  try {
    const { pageKey } = await params;
    if (!PAGE_KEYS.includes(pageKey as PageKey)) {
      return apiError(new Error("Invalid page key"), 400);
    }

    const body = await request.json();
    if (typeof body.internalName !== "string" || typeof body.visible !== "boolean") {
      return apiError(new Error("internalName and visible are required"), 400);
    }

    await setPageSectionVisibility(pageKey as PageKey, body.internalName, body.visible);
    return apiSuccess({ pageKey, internalName: body.internalName, visible: body.visible });
  } catch (error) {
    return apiError(error);
  }
}
