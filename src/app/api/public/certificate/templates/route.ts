import connectDB from "@/lib/db";
import { CertificateDesign } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
import {
  getBuiltinCertificateTemplateList,
  customCertificateTemplateId,
  type CertificateTemplateListItem,
  type CertificateTemplateId,
} from "@/lib/resources/certificate-templates";
import { getHiddenBuiltinCertificateIds } from "@/lib/resources/certificate-template-settings";

export async function GET() {
  try {
    await connectDB();
    const [designs, hiddenBuiltinIds] = await Promise.all([
      CertificateDesign.find({ isActive: true }).sort({ sortOrder: 1, createdAt: -1 }).lean(),
      getHiddenBuiltinCertificateIds(),
    ]);
    const hiddenSet = new Set(hiddenBuiltinIds);

    const builtinTemplates: CertificateTemplateListItem[] = getBuiltinCertificateTemplateList()
      .filter((template) => !hiddenSet.has(template.id as CertificateTemplateId))
      .map((template) => ({ ...template, isBuiltin: true, isActive: true }));

    const customTemplates: CertificateTemplateListItem[] = designs.map((design) => ({
      id: customCertificateTemplateId(String(design._id)),
      name: design.name,
      description: design.description || "Custom certificate design",
      previewPath: design.imageUrl,
    }));

    return apiSuccess({
      templates: [...builtinTemplates, ...customTemplates],
    });
  } catch (error) {
    return apiError(error);
  }
}
