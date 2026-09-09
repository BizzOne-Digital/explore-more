import connectDB from "@/lib/db";
import { CertificateDesign } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
import { requireRole } from "@/lib/api/auth-helpers";
import { storeUploadedImage } from "@/lib/services/stored-upload";
import {
  getBuiltinCertificateTemplateList,
  isCertificateTemplateId,
  type CertificateTemplateId,
} from "@/lib/resources/certificate-templates";
import {
  getHiddenBuiltinCertificateIds,
} from "@/lib/resources/certificate-template-settings";
import { MAX_CERTIFICATE_TEMPLATE_UPLOAD_SIZE } from "@/lib/constants";

export const runtime = "nodejs";

function imageTypeFromUrl(url: string): "jpg" | "png" {
  const lower = url.toLowerCase();
  if (lower.endsWith(".png")) return "png";
  return "jpg";
}

export async function GET() {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    await connectDB();
    const [custom, hiddenBuiltinIds] = await Promise.all([
      CertificateDesign.find().sort({ sortOrder: 1, createdAt: -1 }).lean(),
      getHiddenBuiltinCertificateIds(),
    ]);
    const hiddenSet = new Set(hiddenBuiltinIds);

    return apiSuccess({
      builtin: getBuiltinCertificateTemplateList().map((template) => ({
        ...template,
        isBuiltin: true,
        isActive: !hiddenSet.has(template.id as CertificateTemplateId),
      })),
      custom,
      hiddenBuiltinIds,
    });
  } catch (error) {
    return apiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const sessionResult = await requireRole(["administrator"]);
    if ("error" in sessionResult) return sessionResult.error;

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return apiError(new Error("Invalid form data"), 400);
    }

    const file = formData.get("file");
    const name = String(formData.get("name") ?? "").trim();
    const description = String(formData.get("description") ?? "").trim();

    if (!(file instanceof File)) {
      return apiError(new Error("Please select an image file."), 400);
    }

    if (!name) {
      return apiError(new Error("Please enter a design name."), 400);
    }

    await connectDB();
    const uploaded = await storeUploadedImage(
      file,
      "certificate-templates",
      MAX_CERTIFICATE_TEMPLATE_UPLOAD_SIZE
    );

    const design = await CertificateDesign.create({
      name,
      description,
      imageUrl: uploaded.url,
      imageType: imageTypeFromUrl(uploaded.url),
      isActive: true,
    });

    return apiSuccess(design, 201);
  } catch (error) {
    return apiError(error);
  }
}
