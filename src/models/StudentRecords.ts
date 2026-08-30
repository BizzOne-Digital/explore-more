import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IResult extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;
  programId?: mongoose.Types.ObjectId;
  subject: string;
  assessment: string;
  score?: number;
  maxScore?: number;
  grade?: string;
  feedback?: string;
  date: Date;
  term?: string;
  privateAttachment?: string;
  publishedToStudent: boolean;
  notifiedAt?: Date;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ResultSchema = new Schema<IResult>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
    programId: { type: Schema.Types.ObjectId, ref: "Program" },
    subject: { type: String, required: true },
    assessment: { type: String, required: true },
    score: Number,
    maxScore: Number,
    grade: String,
    feedback: String,
    date: { type: Date, required: true },
    term: String,
    privateAttachment: String,
    publishedToStudent: { type: Boolean, default: false },
    notifiedAt: Date,
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

ResultSchema.index({ studentId: 1, publishedToStudent: 1 });

export const Result: Model<IResult> =
  mongoose.models.Result ?? mongoose.model<IResult>("Result", ResultSchema);

export interface IAttendance extends Document {
  studentId: mongoose.Types.ObjectId;
  courseId?: mongoose.Types.ObjectId;
  eventId?: mongoose.Types.ObjectId;
  sessionDate: Date;
  status: "present" | "absent" | "late" | "excused" | "early_dismissal" | "other";
  notes?: string;
  recordedBy: mongoose.Types.ObjectId;
  isDailyLog?: boolean;
  parentExcuseNote?: string;
  parentExcuseDocUrl?: string;
  parentExcuseSubmittedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
    eventId: { type: Schema.Types.ObjectId, ref: "Event" },
    sessionDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused", "early_dismissal", "other"],
      required: true,
    },
    notes: String,
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    isDailyLog: { type: Boolean, default: false },
    parentExcuseNote: String,
    parentExcuseDocUrl: String,
    parentExcuseSubmittedAt: Date,
  },
  { timestamps: true }
);

export const Attendance: Model<IAttendance> =
  mongoose.models.Attendance ??
  mongoose.model<IAttendance>("Attendance", AttendanceSchema);

export interface ICertificate extends Document {
  studentId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  courseId?: mongoose.Types.ObjectId;
  programId?: mongoose.Types.ObjectId;
  eventId?: mongoose.Types.ObjectId;
  associatedCourse?: string;
  associatedProgram?: string;
  associatedEvent?: string;
  grade?: string;
  issueDate: Date;
  filePath: string;
  fileType: "image" | "pdf";
  verificationCode?: string;
  isShareable: boolean;
  publishedToStudent: boolean;
  publishedAt?: Date;
  notificationSent: boolean;
  notificationSentAt?: Date;
  issuedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true },
    description: String,
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
    programId: { type: Schema.Types.ObjectId, ref: "Program" },
    eventId: { type: Schema.Types.ObjectId, ref: "Event" },
    associatedCourse: String,
    associatedProgram: String,
    associatedEvent: String,
    grade: String,
    issueDate: { type: Date, required: true },
    filePath: { type: String, required: true },
    fileType: { type: String, enum: ["image", "pdf"], default: "pdf" },
    verificationCode: String,
    isShareable: { type: Boolean, default: false },
    publishedToStudent: { type: Boolean, default: false },
    publishedAt: Date,
    notificationSent: { type: Boolean, default: false },
    notificationSentAt: Date,
    issuedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Certificate: Model<ICertificate> =
  mongoose.models.Certificate ??
  mongoose.model<ICertificate>("Certificate", CertificateSchema);

export interface IResource extends Document {
  title: string;
  description?: string;
  type: "pdf" | "link" | "worksheet" | "reading" | "homework" | "study_guide" | "lesson_notes" | "practice_test" | "image" | "video" | "assessment" | "other";
  filePath?: string;
  url?: string;
  courseId?: mongoose.Types.ObjectId;
  programId?: mongoose.Types.ObjectId;
  isPublic: boolean;
  assignedStudentIds: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ResourceSchema = new Schema<IResource>(
  {
    title: { type: String, required: true },
    description: String,
    type: { type: String, enum: ["pdf", "link", "worksheet", "reading", "homework", "study_guide", "lesson_notes", "practice_test", "image", "video", "assessment", "other"], required: true },
    filePath: String,
    url: String,
    courseId: { type: Schema.Types.ObjectId, ref: "Course" },
    programId: { type: Schema.Types.ObjectId, ref: "Program" },
    isPublic: { type: Boolean, default: false },
    assignedStudentIds: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export const Resource: Model<IResource> =
  mongoose.models.Resource ?? mongoose.model<IResource>("Resource", ResourceSchema);
