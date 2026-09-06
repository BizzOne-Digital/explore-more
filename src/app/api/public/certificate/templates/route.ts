import connectDB from "@/lib/db";
import { CertificateDesign } from "@/models";
import { apiSuccess, apiError } from "@/lib/admin/api";
import {
  getBuiltinCertificateTemplateList,
  customCertificateTemplateId,
  type CertificateTemplateListItem,
} from "@/lib/resources/certificate-templates";

export async function GET() {
  try {
    await connectDB();
    const designs = await CertificateDesign.find({ isActive: true })
      .sort({ sortOrder: 1, createdAt: -1 })
      .lean();

    const customTemplates: CertificateTemplateListItem[] = designs.map((design) => ({
      id: customCertificateTemplateId(String(design._id)),
      name: design.name,
      description: design.description || "Custom certificate design",
      previewPath: design.imageUrl,
    }));

    return apiSuccess({
      templates: [...getBuiltinCertificateTemplateList(), ...customTemplates],
    });
  } catch (error) {
    return apiError(error);
  }
}
