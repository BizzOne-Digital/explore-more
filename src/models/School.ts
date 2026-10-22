import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ISchool extends Document {
  name: string;
  slug: string;
  district?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SchoolSchema = new Schema<ISchool>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    district: String,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export interface ITeacherSchoolMembership extends Document {
  userId: mongoose.Types.ObjectId;
  schoolId: mongoose.Types.ObjectId;
  jobTitle?: string;
  isPrimary: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherSchoolMembershipSchema = new Schema<ITeacherSchoolMembership>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    jobTitle: String,
    isPrimary: { type: Boolean, default: true },
  },
  { timestamps: true }
);
TeacherSchoolMembershipSchema.index({ userId: 1, schoolId: 1 }, { unique: true });
TeacherSchoolMembershipSchema.index({ schoolId: 1 });

export interface ISchoolTeacherConversation extends Document {
  schoolId: mongoose.Types.ObjectId;
  participants: mongoose.Types.ObjectId[];
  initiatorId: mongoose.Types.ObjectId;
  recipientId: mongoose.Types.ObjectId;
  subject: string;
  lastMessageAt: Date;
  unreadCounts: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const SchoolTeacherConversationSchema = new Schema<ISchoolTeacherConversation>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    participants: [{ type: Schema.Types.ObjectId, ref: "User", required: true }],
    initiatorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    lastMessageAt: { type: Date, default: Date.now },
    unreadCounts: { type: Map, of: Number, default: {} },
  },
  { timestamps: true }
);
SchoolTeacherConversationSchema.index({ schoolId: 1, lastMessageAt: -1 });
SchoolTeacherConversationSchema.index({ participants: 1, schoolId: 1 });

export interface ISchoolTeacherMessage extends Document {
  conversationId: mongoose.Types.ObjectId;
  schoolId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  body: string;
  resourcePath?: string;
  resourceName?: string;
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

const SchoolTeacherMessageSchema = new Schema<ISchoolTeacherMessage>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "SchoolTeacherConversation", required: true },
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true },
    resourcePath: String,
    resourceName: String,
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
SchoolTeacherMessageSchema.index({ conversationId: 1, createdAt: 1 });

/** Students assigned to a school teacher’s class roster for attendance, grades, etc. */
export interface ITeacherClassRoster extends Document {
  schoolId: mongoose.Types.ObjectId;
  teacherId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  schoolYear: string;
  grade?: string;
  className?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TeacherClassRosterSchema = new Schema<ITeacherClassRoster>(
  {
    schoolId: { type: Schema.Types.ObjectId, ref: "School", required: true, index: true },
    teacherId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    schoolYear: { type: String, required: true },
    grade: String,
    className: String,
  },
  { timestamps: true }
);
TeacherClassRosterSchema.index(
  { teacherId: 1, studentId: 1, schoolYear: 1 },
  { unique: true }
);

export const School: Model<ISchool> =
  mongoose.models.School ?? mongoose.model<ISchool>("School", SchoolSchema);

export const TeacherClassRoster: Model<ITeacherClassRoster> =
  mongoose.models.TeacherClassRoster ??
  mongoose.model<ITeacherClassRoster>("TeacherClassRoster", TeacherClassRosterSchema);

export const TeacherSchoolMembership: Model<ITeacherSchoolMembership> =
  mongoose.models.TeacherSchoolMembership ??
  mongoose.model<ITeacherSchoolMembership>("TeacherSchoolMembership", TeacherSchoolMembershipSchema);

export const SchoolTeacherConversation: Model<ISchoolTeacherConversation> =
  mongoose.models.SchoolTeacherConversation ??
  mongoose.model<ISchoolTeacherConversation>(
    "SchoolTeacherConversation",
    SchoolTeacherConversationSchema
  );

export const SchoolTeacherMessage: Model<ISchoolTeacherMessage> =
  mongoose.models.SchoolTeacherMessage ??
  mongoose.model<ISchoolTeacherMessage>("SchoolTeacherMessage", SchoolTeacherMessageSchema);
