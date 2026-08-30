import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { StaffMessageCategory } from "@/lib/tutor/constants";

export interface ITutorStudentAssignment extends Document {
  tutorId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  subjects: string[];
  scheduleNotes?: string;
  learningGoals?: string;
  tutorNotes?: string;
  status: "active" | "paused" | "ended";
  assignedBy: mongoose.Types.ObjectId;
  assignedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TutorStudentAssignmentSchema = new Schema<ITutorStudentAssignment>(
  {
    tutorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subjects: { type: [String], default: [] },
    scheduleNotes: String,
    learningGoals: String,
    tutorNotes: String,
    status: { type: String, enum: ["active", "paused", "ended"], default: "active" },
    assignedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

TutorStudentAssignmentSchema.index({ tutorId: 1, studentId: 1 }, { unique: true });
TutorStudentAssignmentSchema.index({ tutorId: 1, status: 1 });
TutorStudentAssignmentSchema.index({ studentId: 1, status: 1 });

export const TutorStudentAssignment: Model<ITutorStudentAssignment> =
  mongoose.models.TutorStudentAssignment ??
  mongoose.model<ITutorStudentAssignment>("TutorStudentAssignment", TutorStudentAssignmentSchema);

export interface ITutorSession extends Document {
  tutorId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  assignmentId?: mongoose.Types.ObjectId;
  sessionDate: Date;
  subject: string;
  topicCovered?: string;
  workedOn?: string;
  studentProgress?: string;
  areasNeedingPractice?: string;
  homeworkAssigned?: string;
  privateStaffNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TutorSessionSchema = new Schema<ITutorSession>(
  {
    tutorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    assignmentId: { type: Schema.Types.ObjectId, ref: "TutorStudentAssignment" },
    sessionDate: { type: Date, required: true },
    subject: { type: String, required: true },
    topicCovered: String,
    workedOn: String,
    studentProgress: String,
    areasNeedingPractice: String,
    homeworkAssigned: String,
    privateStaffNotes: String,
  },
  { timestamps: true }
);

TutorSessionSchema.index({ tutorId: 1, sessionDate: -1 });
TutorSessionSchema.index({ studentId: 1, sessionDate: -1 });

export const TutorSession: Model<ITutorSession> =
  mongoose.models.TutorSession ??
  mongoose.model<ITutorSession>("TutorSession", TutorSessionSchema);

export interface IStaffInternalConversation extends Document {
  participants: mongoose.Types.ObjectId[];
  initiatorId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  category: StaffMessageCategory;
  subject: string;
  lastMessageAt: Date;
  unreadCounts: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const StaffInternalConversationSchema = new Schema<IStaffInternalConversation>(
  {
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    initiatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: {
      type: String,
      enum: ["administration", "academic_support", "tutor_support", "technical_support", "peer_tutor"],
      default: "administration",
    },
    subject: { type: String, required: true },
    lastMessageAt: { type: Date, default: Date.now },
    unreadCounts: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);

StaffInternalConversationSchema.index({ participants: 1, lastMessageAt: -1 });

export const StaffInternalConversation: Model<IStaffInternalConversation> =
  mongoose.models.StaffInternalConversation ??
  mongoose.model<IStaffInternalConversation>(
    "StaffInternalConversation",
    StaffInternalConversationSchema
  );

export interface IStaffInternalMessage extends Document {
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
  createdAt: Date;
  updatedAt: Date;
}

const StaffInternalMessageSchema = new Schema<IStaffInternalMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "StaffInternalConversation", required: true },
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
  },
  { timestamps: true }
);

StaffInternalMessageSchema.index({ conversationId: 1, createdAt: 1 });

export const StaffInternalMessage: Model<IStaffInternalMessage> =
  mongoose.models.StaffInternalMessage ??
  mongoose.model<IStaffInternalMessage>("StaffInternalMessage", StaffInternalMessageSchema);

export interface ITutorNotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: "message" | "resource" | "session" | "assignment" | "academy" | "general";
  title: string;
  body?: string;
  link?: string;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TutorNotificationSchema = new Schema<ITutorNotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    type: {
      type: String,
      enum: ["message", "resource", "session", "assignment", "academy", "general"],
      default: "general",
    },
    title: { type: String, required: true },
    body: String,
    link: String,
    readAt: Date,
  },
  { timestamps: true }
);

TutorNotificationSchema.index({ userId: 1, readAt: 1, createdAt: -1 });

export const TutorNotification: Model<ITutorNotification> =
  mongoose.models.TutorNotification ??
  mongoose.model<ITutorNotification>("TutorNotification", TutorNotificationSchema);
