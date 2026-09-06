import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ICertificateDesign extends Document {
  name: string;
  description: string;
  imageUrl: string;
  imageType: "jpg" | "png";
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const CertificateDesignSchema = new Schema<ICertificateDesign>(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "", trim: true },
    imageUrl: { type: String, required: true },
    imageType: { type: String, enum: ["jpg", "png"], required: true },
    isActive: { type: Boolean, default: true, index: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const CertificateDesign: Model<ICertificateDesign> =
  mongoose.models.CertificateDesign ??
  mongoose.model<ICertificateDesign>("CertificateDesign", CertificateDesignSchema);
