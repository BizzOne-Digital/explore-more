import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { CertificateTemplateId } from "@/lib/resources/certificate-templates";

export interface ICertificateTemplateSettings extends Document {
  hiddenBuiltinIds: CertificateTemplateId[];
  createdAt: Date;
  updatedAt: Date;
}

const CertificateTemplateSettingsSchema = new Schema<ICertificateTemplateSettings>(
  {
    hiddenBuiltinIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

export const CertificateTemplateSettings: Model<ICertificateTemplateSettings> =
  mongoose.models.CertificateTemplateSettings ??
  mongoose.model<ICertificateTemplateSettings>(
    "CertificateTemplateSettings",
    CertificateTemplateSettingsSchema
  );
