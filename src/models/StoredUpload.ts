import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { PrivateStoredFolder, StoredUploadFolder } from "@/lib/constants";

export type UploadStorageFolder = StoredUploadFolder | PrivateStoredFolder;

export interface IStoredUpload extends Document {
  folder: UploadStorageFolder;
  filename: string;
  mimeType: string;
  size: number;
  data: Buffer;
  createdAt: Date;
  updatedAt: Date;
}

const StoredUploadSchema = new Schema<IStoredUpload>(
  {
    folder: { type: String, required: true, index: true },
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    data: { type: Buffer, required: true },
  },
  { timestamps: true }
);

StoredUploadSchema.index({ folder: 1, filename: 1 }, { unique: true });

export const StoredUpload: Model<IStoredUpload> =
  mongoose.models.StoredUpload ??
  mongoose.model<IStoredUpload>("StoredUpload", StoredUploadSchema);
