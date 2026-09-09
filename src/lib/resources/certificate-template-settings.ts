import connectDB from "@/lib/db";
import { CertificateTemplateSettings } from "@/models/CertificateTemplateSettings";
import {
  isCertificateTemplateId,
  type CertificateTemplateId,
} from "@/lib/resources/certificate-templates";

async function getSettingsDoc() {
  await connectDB();
  return CertificateTemplateSettings.findOneAndUpdate(
    {},
    { $setOnInsert: { hiddenBuiltinIds: [] } },
    { upsert: true, new: true }
  ).lean();
}

export async function getHiddenBuiltinCertificateIds(): Promise<CertificateTemplateId[]> {
  const doc = await getSettingsDoc();
  return (doc?.hiddenBuiltinIds ?? []).filter(isCertificateTemplateId);
}

export async function setBuiltinTemplateHidden(
  templateId: CertificateTemplateId,
  hidden: boolean
): Promise<CertificateTemplateId[]> {
  if (!isCertificateTemplateId(templateId)) {
    throw new Error("Invalid built-in certificate template.");
  }

  await connectDB();
  const doc = await CertificateTemplateSettings.findOne().lean();
  const hiddenIds = new Set(doc?.hiddenBuiltinIds ?? []);

  if (hidden) hiddenIds.add(templateId);
  else hiddenIds.delete(templateId);

  const next = Array.from(hiddenIds).filter(isCertificateTemplateId);
  await CertificateTemplateSettings.findOneAndUpdate(
    {},
    { hiddenBuiltinIds: next },
    { upsert: true }
  );

  return next;
}

export async function isBuiltinCertificateTemplateHidden(
  templateId: string
): Promise<boolean> {
  if (!isCertificateTemplateId(templateId)) return false;
  const hidden = await getHiddenBuiltinCertificateIds();
  return hidden.includes(templateId);
}
