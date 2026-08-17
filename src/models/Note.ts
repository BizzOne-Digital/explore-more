import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IAccountNote extends Document {
  accountId: mongoose.Types.ObjectId;
  accountType: "parent" | "student";
  createdBy: mongoose.Types.ObjectId;
  staffName: string;
  staffId: string;
  callerName: string;
  subject: string;
  reasonForCall: string;
  noteContent: string;
  followUpNeeded: boolean;
  followUpDate?: Date;
  followUpCompleted: boolean;
  isVisibleToParent: boolean;
  isEdited: boolean;
  editedBy?: mongoose.Types.ObjectId;
  editedAt?: Date;
  isDeleted: boolean;
  deletedBy?: mongoose.Types.ObjectId;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AccountNoteSchema = new Schema<IAccountNote>(
  {
    accountId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    accountType: { type: String, enum: ["parent", "student"], required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    staffName: { type: String, required: true },
    staffId: { type: String, required: true },
    callerName: { type: String, required: true },
    subject: { type: String, required: true },
    reasonForCall: { type: String, required: true },
    noteContent: { type: String, required: true },
    followUpNeeded: { type: Boolean, default: false },
    followUpDate: Date,
    followUpCompleted: { type: Boolean, default: false },
    isVisibleToParent: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
    editedBy: { type: Schema.Types.ObjectId, ref: "User" },
    editedAt: Date,
    isDeleted: { type: Boolean, default: false },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedAt: Date,
  },
  { timestamps: true }
);

// Indexes for efficient queries
AccountNoteSchema.index({ accountId: 1, createdAt: -1 });
AccountNoteSchema.index({ createdBy: 1 });
AccountNoteSchema.index({ staffId: 1 });
AccountNoteSchema.index({ followUpNeeded: 1, followUpDate: 1 });
AccountNoteSchema.index({ isDeleted: 1 });
AccountNoteSchema.index({ createdAt: -1 });

// Text search index
AccountNoteSchema.index({
  staffName: "text",
  callerName: "text",
  subject: "text",
  reasonForCall: "text",
  noteContent: "text",
});

export const AccountNote: Model<IAccountNote> =
  mongoose.models.AccountNote ??
  mongoose.model<IAccountNote>("AccountNote", AccountNoteSchema);
