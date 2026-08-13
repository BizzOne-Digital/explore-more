import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { NotificationAudience, NotificationPriority } from "@/lib/portfolio/constants";

export interface IParentNotification extends Document {
  title: string;
  message: string;
  audience: NotificationAudience;
  recipientIds: mongoose.Types.ObjectId[];
  priority: NotificationPriority;
  attachmentPath?: string;
  attachmentName?: string;
  requiresAcknowledgment: boolean;
  sentBy: mongoose.Types.ObjectId;
  scheduledFor?: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ParentNotificationSchema = new Schema<IParentNotification>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    audience: {
      type: String,
      enum: ["all_parents", "homeschool_families", "tutoring_families", "custom"],
      default: "all_parents",
    },
    recipientIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    priority: { type: String, enum: ["normal", "important", "urgent"], default: "normal" },
    attachmentPath: String,
    attachmentName: String,
    requiresAcknowledgment: { type: Boolean, default: false },
    sentBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    scheduledFor: Date,
    sentAt: Date,
  },
  { timestamps: true }
);

export const ParentNotification: Model<IParentNotification> =
  mongoose.models.ParentNotification ??
  mongoose.model<IParentNotification>("ParentNotification", ParentNotificationSchema);

export interface IParentNotificationRead extends Document {
  notificationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  readAt?: Date;
  acknowledgedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ParentNotificationReadSchema = new Schema<IParentNotificationRead>(
  {
    notificationId: { type: Schema.Types.ObjectId, ref: "ParentNotification", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    readAt: Date,
    acknowledgedAt: Date,
  },
  { timestamps: true }
);

ParentNotificationReadSchema.index({ notificationId: 1, userId: 1 }, { unique: true });
ParentNotificationReadSchema.index({ userId: 1, readAt: 1 });

export const ParentNotificationRead: Model<IParentNotificationRead> =
  mongoose.models.ParentNotificationRead ??
  mongoose.model<IParentNotificationRead>("ParentNotificationRead", ParentNotificationReadSchema);
