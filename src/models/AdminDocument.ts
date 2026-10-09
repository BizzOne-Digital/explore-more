import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IAdminDocumentFolder extends Document {
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

const AdminDocumentFolderSchema = new Schema<IAdminDocumentFolder>(
  {
    name: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export interface IAdminDocument extends Document {
  folderId: mongoose.Types.ObjectId;
  title: string;
  filePath: string;
  originalFileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const AdminDocumentSchema = new Schema<IAdminDocument>(
  {
    folderId: { type: Schema.Types.ObjectId, ref: "AdminDocumentFolder", required: true, index: true },
    title: { type: String, required: true, trim: true },
    filePath: { type: String, required: true },
    originalFileName: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

AdminDocumentSchema.index({ folderId: 1, title: 1 });

export const AdminDocumentFolder: Model<IAdminDocumentFolder> =
  mongoose.models.AdminDocumentFolder ??
  mongoose.model<IAdminDocumentFolder>("AdminDocumentFolder", AdminDocumentFolderSchema);

export const AdminDocument: Model<IAdminDocument> =
  mongoose.models.AdminDocument ??
  mongoose.model<IAdminDocument>("AdminDocument", AdminDocumentSchema);
