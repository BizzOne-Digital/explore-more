import { apiSuccess, apiError } from "@/lib/admin/api";
import { requireRole } from "@/lib/api/auth-helpers";
import { isCertificateTemplateId } from "@/lib/resources/certificate-templates";
import { setBuiltinTemplateHidden } from "@/lib/resources/certificate-template-settings";

export const runtime = "nodejs";

interface RouteParams {
  params: Promise<{ templateId: string }>;
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    const { templateId } = await params;
    if (!isCertificateTemplateId(templateId)) {
      return apiError(new Error("Built-in certificate template not found."), 404);
    }

    const body = await request.json();
    if (typeof body.hidden !== "boolean") {
      return apiError(new Error("Please provide hidden: true or false."), 400);
    }

    const hiddenBuiltinIds = await setBuiltinTemplateHidden(templateId, body.hidden);
    return apiSuccess({ templateId, hidden: body.hidden, hiddenBuiltinIds });
  } catch (error) {
    return apiError(error);
  }
}
