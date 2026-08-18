import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IEmailCampaign extends Document {
  type: "event" | "course" | "announcement" | "custom";
  subject: string;
  htmlBody: string;
  textBody?: string;
  relatedId?: mongoose.Types.ObjectId;
  deliveryMethod: "email" | "notification" | "both";
  audience: "all_parents" | "portfolio_parents" | "tutoring_parents" | "custom";
  recipientIds?: mongoose.Types.ObjectId[];
  priority: "normal" | "important" | "urgent";
  attachmentUrl?: string;
  attachmentName?: string;
  imageUrl?: string;
  imageName?: string;
  status: "draft" | "queued" | "sending" | "sent" | "failed";
  recipientCount: number;
  sentCount: number;
  failedCount: number;
  openedCount: number;
  clickedCount: number;
  createdBy: mongoose.Types.ObjectId;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EmailCampaignSchema = new Schema<IEmailCampaign>(
  {
    type: {
      type: String,
      enum: ["event", "course", "announcement", "custom"],
      required: true,
    },
    subject: { type: String, required: true },
    htmlBody: { type: String, required: true },
    textBody: String,
    relatedId: Schema.Types.ObjectId,
    deliveryMethod: {
      type: String,
      enum: ["email", "notification", "both"],
      default: "email",
    },
    audience: {
      type: String,
      enum: ["all_parents", "portfolio_parents", "tutoring_parents", "custom"],
      default: "all_parents",
    },
    recipientIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    priority: {
      type: String,
      enum: ["normal", "important", "urgent"],
      default: "normal",
    },
    attachmentUrl: String,
    attachmentName: String,
    imageUrl: String,
    imageName: String,
    status: {
      type: String,
      enum: ["draft", "queued", "sending", "sent", "failed"],
      default: "draft",
    },
    recipientCount: { type: Number, default: 0 },
    sentCount: { type: Number, default: 0 },
    failedCount: { type: Number, default: 0 },
    openedCount: { type: Number, default: 0 },
    clickedCount: { type: Number, default: 0 },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    sentAt: Date,
  },
  { timestamps: true }
);

export const EmailCampaign: Model<IEmailCampaign> =
  mongoose.models.EmailCampaign ??
  mongoose.model<IEmailCampaign>("EmailCampaign", EmailCampaignSchema);

export interface IEmailJob extends Document {
  campaignId?: mongoose.Types.ObjectId;
  to: string;
  subject: string;
  htmlBody: string;
  textBody?: string;
  template: string;
  status: "queued" | "sending" | "sent" | "failed";
  attempts: number;
  lastError?: string;
  sentAt?: Date;
  metadata?: Record<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

const EmailJobSchema = new Schema<IEmailJob>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: "EmailCampaign" },
    to: { type: String, required: true },
    subject: { type: String, required: true },
    htmlBody: { type: String, required: true },
    textBody: String,
    template: { type: String, required: true },
    status: {
      type: String,
      enum: ["queued", "sending", "sent", "failed"],
      default: "queued",
    },
    attempts: { type: Number, default: 0 },
    lastError: String,
    sentAt: Date,
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true }
);

EmailJobSchema.index({ status: 1, createdAt: 1 });

export const EmailJob: Model<IEmailJob> =
  mongoose.models.EmailJob ?? mongoose.model<IEmailJob>("EmailJob", EmailJobSchema);

export interface IActivityLog extends Document {
  userId?: mongoose.Types.ObjectId;
  performedBy?: mongoose.Types.ObjectId;
  action: string;
  entity: string;
  entityId?: string;
  changes?: Record<string, { old: unknown; new: unknown }>;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    performedBy: { type: Schema.Types.ObjectId, ref: "User" },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: String,
    changes: Schema.Types.Mixed,
    details: String,
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ userId: 1 });
ActivityLogSchema.index({ performedBy: 1 });
ActivityLogSchema.index({ entity: 1, entityId: 1 });

export const ActivityLog: Model<IActivityLog> =
  mongoose.models.ActivityLog ??
  mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
