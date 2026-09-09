import fs from "fs/promises";
import path from "path";
import mongoose from "mongoose";
import connectDB from "@/lib/db";
import { CertificateDesign } from "@/models/CertificateDesign";
import {
  getCertificateTemplate,
  DEFAULT_CERTIFICATE_FIELD_LAYOUT,
  parseCustomCertificateTemplateId,
  customCertificateTemplateId,
  isCertificateTemplateId,
  type CertificateTemplateDefinition,
} from "@/lib/resources/certificate-templates";
import { getStoredUpload, parseStoredUploadUrl } from "@/lib/services/stored-upload";
import { getHiddenBuiltinCertificateIds } from "@/lib/resources/certificate-template-settings";

export async function isValidCertificateTemplateId(value: string): Promise<boolean> {
  if (isCertificateTemplateId(value)) {
    const hidden = await getHiddenBuiltinCertificateIds();
    return !hidden.includes(value);
  }
  const designId = parseCustomCertificateTemplateId(value);
  return designId !== null && mongoose.Types.ObjectId.isValid(designId);
}

export async function resolveCertificateTemplate(
  templateId?: string
): Promise<CertificateTemplateDefinition> {
  const customId = templateId ? parseCustomCertificateTemplateId(templateId) : null;
  if (customId && mongoose.Types.ObjectId.isValid(customId)) {
    await connectDB();
    const design = await CertificateDesign.findOne({ _id: customId, isActive: true }).lean();
    if (design) {
      return {
        id: customCertificateTemplateId(String(design._id)),
        name: design.name,
        description: design.description,
        imagePath: design.imageUrl,
        imageType: design.imageType,
        previewPath: design.imageUrl,
        layout: DEFAULT_CERTIFICATE_FIELD_LAYOUT,
      };
    }
  }

  return getCertificateTemplate(templateId);
}

export async function loadCertificateTemplateImage(
  template: CertificateTemplateDefinition
): Promise<Buffer> {
  if (parseCustomCertificateTemplateId(template.id)) {
    const parsed = parseStoredUploadUrl(template.previewPath);
    if (!parsed) {
      throw new Error("Invalid custom certificate image URL.");
    }
    const doc = await getStoredUpload(parsed.folder, parsed.filename);
    if (!doc?.data) {
      throw new Error("Certificate design image not found.");
    }
    const raw = doc.data as Buffer | { buffer: ArrayBuffer } | Uint8Array;
    return Buffer.isBuffer(raw)
      ? raw
      : raw instanceof Uint8Array
        ? Buffer.from(raw)
        : Buffer.from(new Uint8Array(raw.buffer));
  }

  const filePath = path.join(process.cwd(), "public", template.imagePath);
  return fs.readFile(filePath);
}
