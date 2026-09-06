import connectDB from "@/lib/db";
import { CertificateDesign } from "@/models";
import { apiSuccess, apiError, isValidObjectId, notFound } from "@/lib/admin/api";
import { requireRole } from "@/lib/api/auth-helpers";
import { deleteStoredUploadByUrl } from "@/lib/services/stored-upload";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    const { id } = await params;
    if (!isValidObjectId(id)) return notFound();

    const body = await request.json();
    const patch: Record<string, unknown> = {};

    if (typeof body.name === "string" && body.name.trim()) {
      patch.name = body.name.trim();
    }
    if (typeof body.description === "string") {
      patch.description = body.description.trim();
    }
    if (typeof body.isActive === "boolean") {
      patch.isActive = body.isActive;
    }
    if (typeof body.sortOrder === "number") {
      patch.sortOrder = body.sortOrder;
    }

    await connectDB();
    const design = await CertificateDesign.findByIdAndUpdate(id, patch, { new: true }).lean();
    if (!design) return notFound();

    return apiSuccess(design);
  } catch (error) {
    return apiError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    const { id } = await params;
    if (!isValidObjectId(id)) return notFound();

    await connectDB();
    const design = await CertificateDesign.findById(id).lean();
    if (!design) return notFound();

    await deleteStoredUploadByUrl(design.imageUrl);
    await CertificateDesign.findByIdAndDelete(id);

    return apiSuccess({ deleted: true });
  } catch (error) {
    return apiError(error);
  }
}
