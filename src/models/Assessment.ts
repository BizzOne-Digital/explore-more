import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IAssessment extends Document {
  title: string;
  grade: string;
  filePath: string;
  createdBy: mongoose.Types.ObjectId;
  notifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentSchema = new Schema<IAssessment>(
  {
    title: { type: String, required: true, trim: true },
    grade: { type: String, required: true },
    filePath: { type: String, required: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    notifiedAt: Date,
  },
  { timestamps: true }
);

AssessmentSchema.index({ grade: 1, createdAt: -1 });

export const Assessment: Model<IAssessment> =
  mongoose.models.Assessment ?? mongoose.model<IAssessment>("Assessment", AssessmentSchema);

export interface IAssessmentSubmission extends Document {
  assessmentId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  filePath: string;
  submittedAt: Date;
  letterGrade?: string;
  published: boolean;
  publishedAt?: Date;
  gradedBy?: mongoose.Types.ObjectId;
  gradedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentSubmissionSchema = new Schema<IAssessmentSubmission>(
  {
    assessmentId: { type: Schema.Types.ObjectId, ref: "Assessment", required: true },
    parentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    filePath: { type: String, required: true },
    submittedAt: { type: Date, required: true },
    letterGrade: String,
    published: { type: Boolean, default: false },
    publishedAt: Date,
    gradedBy: { type: Schema.Types.ObjectId, ref: "User" },
    gradedAt: Date,
  },
  { timestamps: true }
);

AssessmentSubmissionSchema.index({ assessmentId: 1, studentId: 1 }, { unique: true });
AssessmentSubmissionSchema.index({ assessmentId: 1, parentId: 1 });
AssessmentSubmissionSchema.index({ parentId: 1, published: 1 });

export const AssessmentSubmission: Model<IAssessmentSubmission> =
  mongoose.models.AssessmentSubmission ??
  mongoose.model<IAssessmentSubmission>("AssessmentSubmission", AssessmentSubmissionSchema);
