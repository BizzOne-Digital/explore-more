import mongoose, { Schema, type Document, type Model } from "mongoose";
import type {
  ActivityCategory,
  AttendanceType,
  PortfolioStatus,
  PortfolioSubject,
  ProgressMarker,
  ReadingResourceType,
} from "@/lib/portfolio/constants";

export interface IPortfolioFile {
  path: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
}

const PortfolioFileSchema = new Schema<IPortfolioFile>(
  {
    path: { type: String, required: true },
    filename: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false }
);

export interface IHomeschoolPortfolio extends Document {
  studentId: mongoose.Types.ObjectId;
  guardianId: mongoose.Types.ObjectId;
  schoolYear: string;
  status: PortfolioStatus;
  submittedAt?: Date;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewCompletedAt?: Date;
  reviewerNotes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HomeschoolPortfolioSchema = new Schema<IHomeschoolPortfolio>(
  {
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    guardianId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    schoolYear: { type: String, required: true },
    status: {
      type: String,
      enum: ["draft", "submitted", "under_review", "additional_docs_requested", "completed"],
      default: "draft",
    },
    submittedAt: Date,
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewCompletedAt: Date,
    reviewerNotes: String,
  },
  { timestamps: true }
);

HomeschoolPortfolioSchema.index({ studentId: 1, schoolYear: 1 }, { unique: true });
HomeschoolPortfolioSchema.index({ guardianId: 1, schoolYear: 1 });

export const HomeschoolPortfolio: Model<IHomeschoolPortfolio> =
  mongoose.models.HomeschoolPortfolio ??
  mongoose.model<IHomeschoolPortfolio>("HomeschoolPortfolio", HomeschoolPortfolioSchema);

export interface IPortfolioWorkSample extends Document {
  portfolioId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  subject: PortfolioSubject;
  assignmentName: string;
  dateCompleted: Date;
  description?: string;
  progressMarker: ProgressMarker;
  files: IPortfolioFile[];
  reviewerComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioWorkSampleSchema = new Schema<IPortfolioWorkSample>(
  {
    portfolioId: { type: Schema.Types.ObjectId, ref: "HomeschoolPortfolio", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    assignmentName: { type: String, required: true },
    dateCompleted: { type: Date, required: true },
    description: String,
    progressMarker: {
      type: String,
      enum: ["none", "beginning_of_year", "middle_of_year", "end_of_year"],
      default: "none",
    },
    files: { type: [PortfolioFileSchema], default: [] },
    reviewerComment: String,
  },
  { timestamps: true }
);

PortfolioWorkSampleSchema.index({ portfolioId: 1, subject: 1 });

export const PortfolioWorkSample: Model<IPortfolioWorkSample> =
  mongoose.models.PortfolioWorkSample ??
  mongoose.model<IPortfolioWorkSample>("PortfolioWorkSample", PortfolioWorkSampleSchema);

export interface IPortfolioReadingEntry extends Document {
  portfolioId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  bookTitle: string;
  author?: string;
  subject?: string;
  dateStarted?: Date;
  dateCompleted?: Date;
  resourceType: ReadingResourceType;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioReadingEntrySchema = new Schema<IPortfolioReadingEntry>(
  {
    portfolioId: { type: Schema.Types.ObjectId, ref: "HomeschoolPortfolio", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    bookTitle: { type: String, required: true },
    author: String,
    subject: String,
    dateStarted: Date,
    dateCompleted: Date,
    resourceType: {
      type: String,
      enum: ["book", "textbook", "online_program", "audiobook", "other"],
      default: "book",
    },
    notes: String,
  },
  { timestamps: true }
);

export const PortfolioReadingEntry: Model<IPortfolioReadingEntry> =
  mongoose.models.PortfolioReadingEntry ??
  mongoose.model<IPortfolioReadingEntry>("PortfolioReadingEntry", PortfolioReadingEntrySchema);

export interface IPortfolioActivity extends Document {
  portfolioId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  category: ActivityCategory;
  activityName: string;
  date: Date;
  subject?: string;
  location?: string;
  learned?: string;
  hours?: number;
  files: IPortfolioFile[];
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioActivitySchema = new Schema<IPortfolioActivity>(
  {
    portfolioId: { type: Schema.Types.ObjectId, ref: "HomeschoolPortfolio", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, required: true },
    activityName: { type: String, required: true },
    date: { type: Date, required: true },
    subject: String,
    location: String,
    learned: String,
    hours: Number,
    files: { type: [PortfolioFileSchema], default: [] },
  },
  { timestamps: true }
);

export const PortfolioActivity: Model<IPortfolioActivity> =
  mongoose.models.PortfolioActivity ??
  mongoose.model<IPortfolioActivity>("PortfolioActivity", PortfolioActivitySchema);

export interface IPortfolioAttendance extends Document {
  portfolioId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  date: Date;
  type: AttendanceType;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioAttendanceSchema = new Schema<IPortfolioAttendance>(
  {
    portfolioId: { type: Schema.Types.ObjectId, ref: "HomeschoolPortfolio", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    type: {
      type: String,
      enum: ["present", "instruction", "field_trip", "educational_activity", "holiday"],
      required: true,
    },
    notes: String,
  },
  { timestamps: true }
);

PortfolioAttendanceSchema.index({ portfolioId: 1, date: 1 }, { unique: true });

export const PortfolioAttendance: Model<IPortfolioAttendance> =
  mongoose.models.PortfolioAttendance ??
  mongoose.model<IPortfolioAttendance>("PortfolioAttendance", PortfolioAttendanceSchema);

export interface IPortfolioCurriculum extends Document {
  portfolioId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  subject: PortfolioSubject;
  materialName: string;
  description?: string;
  files: IPortfolioFile[];
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioCurriculumSchema = new Schema<IPortfolioCurriculum>(
  {
    portfolioId: { type: Schema.Types.ObjectId, ref: "HomeschoolPortfolio", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true },
    materialName: { type: String, required: true },
    description: String,
    files: { type: [PortfolioFileSchema], default: [] },
  },
  { timestamps: true }
);

export const PortfolioCurriculum: Model<IPortfolioCurriculum> =
  mongoose.models.PortfolioCurriculum ??
  mongoose.model<IPortfolioCurriculum>("PortfolioCurriculum", PortfolioCurriculumSchema);

export interface IPortfolioReviewRequest extends Document {
  portfolioId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  subject?: string;
  message: string;
  status: "open" | "fulfilled";
  requestedBy: mongoose.Types.ObjectId;
  responseFiles: IPortfolioFile[];
  responseNote?: string;
  fulfilledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PortfolioReviewRequestSchema = new Schema<IPortfolioReviewRequest>(
  {
    portfolioId: { type: Schema.Types.ObjectId, ref: "HomeschoolPortfolio", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    subject: String,
    message: { type: String, required: true },
    status: { type: String, enum: ["open", "fulfilled"], default: "open" },
    requestedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    responseFiles: { type: [PortfolioFileSchema], default: [] },
    responseNote: String,
    fulfilledAt: Date,
  },
  { timestamps: true }
);

export const PortfolioReviewRequest: Model<IPortfolioReviewRequest> =
  mongoose.models.PortfolioReviewRequest ??
  mongoose.model<IPortfolioReviewRequest>("PortfolioReviewRequest", PortfolioReviewRequestSchema);
