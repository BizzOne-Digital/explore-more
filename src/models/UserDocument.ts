import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IUserDocument extends Document {
  userId: mongoose.Types.ObjectId;
  path: string;
  fileName: string;
  originalName: string;
  label?: string;
  mimeType: string;
  size: number;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedByName: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserDocumentSchema = new Schema<IUserDocument>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    path: { type: String, required: true },
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    label: String,
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    uploadedByName: { type: String, required: true },
  },
  { timestamps: true }
);

UserDocumentSchema.index({ userId: 1, createdAt: -1 });
UserDocumentSchema.index({ path: 1 }, { unique: true });

export const UserDocument: Model<IUserDocument> =
  mongoose.models.UserDocument ??
  mongoose.model<IUserDocument>("UserDocument", UserDocumentSchema);
