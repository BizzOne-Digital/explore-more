import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { StaffCategory } from "@/lib/portfolio/constants";

export interface IStaffProfile extends Document {
  userId: mongoose.Types.ObjectId;
  title?: string;
  bio?: string;
  categories: StaffCategory[];
  specialties: string[];
  messagingAvailable: boolean;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const StaffProfileSchema = new Schema<IStaffProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    title: String,
    bio: String,
    categories: {
      type: [String],
      enum: ["portfolio_reviewer", "tutor", "homeschool_support", "administration"],
      default: [],
    },
    specialties: [String],
    messagingAvailable: { type: Boolean, default: true },
    isPublished: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const StaffProfile: Model<IStaffProfile> =
  mongoose.models.StaffProfile ??
  mongoose.model<IStaffProfile>("StaffProfile", StaffProfileSchema);

export interface IConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  parentId: mongoose.Types.ObjectId;
  staffId: mongoose.Types.ObjectId;
  studentId?: mongoose.Types.ObjectId;
  staffCategory?: StaffCategory;
  subject: string;
  lastMessageAt: Date;
  parentUnread: number;
  staffUnread: number;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationSchema = new Schema<IConversation>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    parentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    staffId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User" },
    staffCategory: {
      type: String,
      enum: ["portfolio_reviewer", "tutor", "homeschool_support", "administration"],
    },
    subject: { type: String, required: true },
    lastMessageAt: { type: Date, default: Date.now },
    parentUnread: { type: Number, default: 0 },
    staffUnread: { type: Number, default: 0 },
  },
  { timestamps: true }
);

ConversationSchema.index({ parentId: 1, lastMessageAt: -1 });
ConversationSchema.index({ staffId: 1, lastMessageAt: -1 });

export const Conversation: Model<IConversation> =
  mongoose.models.Conversation ??
  mongoose.model<IConversation>("Conversation", ConversationSchema);

export interface IConversationMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  body: string;
  attachments: Array<{
    path: string;
    filename: string;
    originalName: string;
    mimeType: string;
    size: number;
  }>;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const ConversationMessageSchema = new Schema<IConversationMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
    attachments: {
      type: [
        {
          path: String,
          filename: String,
          originalName: String,
          mimeType: String,
          size: Number,
        },
      ],
      default: [],
    },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ConversationMessageSchema.index({ conversationId: 1, createdAt: 1 });

export const ConversationMessage: Model<IConversationMessage> =
  mongoose.models.ConversationMessage ??
  mongoose.model<IConversationMessage>("ConversationMessage", ConversationMessageSchema);
