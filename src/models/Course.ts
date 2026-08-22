import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ICourseLesson {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  duration?: number;
  order: number;
}

export interface ICourseModule {
  _id?: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  lessons: ICourseLesson[];
  order: number;
}

export interface ICourse extends Document {
  title: string;
  slug: string;
  coverImage?: string;
  gallery: string[];
  shortDescription: string;
  fullDescription: string;
  instructor?: string;
  instructorId?: mongoose.Types.ObjectId;
  category?: string;
  ageRange?: string;
  grade?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  deliveryFormat?: string;
  startDate?: Date;
  endDate?: Date;
  schedule?: string;
  capacity?: number;
  materials?: string;
  priceAmount: number;
  isFree: boolean;
  courseType: "free" | "paid";
  prerequisites?: string;
  learningOutcomes: string[];
  modules: ICourseModule[];
  resources: string[];
  featured: boolean;
  enrollmentStatus: "open" | "closed" | "waitlist";
  status: "draft" | "published" | "archived";
  publishedToWebsite: boolean;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CourseLessonSchema = new Schema<ICourseLesson>(
  {
    title: { type: String, required: true },
    description: String,
    duration: Number,
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const CourseModuleSchema = new Schema<ICourseModule>(
  {
    title: { type: String, required: true },
    description: String,
    lessons: [CourseLessonSchema],
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const CourseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    coverImage: String,
    gallery: [String],
    shortDescription: { type: String, required: true },
    fullDescription: { type: String, required: true },
    instructor: String,
    instructorId: { type: Schema.Types.ObjectId, ref: "User" },
    category: String,
    ageRange: String,
    grade: String,
    difficulty: { type: String, enum: ["beginner", "intermediate", "advanced"] },
    deliveryFormat: String,
    startDate: Date,
    endDate: Date,
    schedule: String,
    capacity: Number,
    materials: String,
    priceAmount: { type: Number, default: 0 },
    isFree: { type: Boolean, default: false },
    courseType: { type: String, enum: ["free", "paid"], default: "free" },
    prerequisites: String,
    learningOutcomes: [String],
    modules: [CourseModuleSchema],
    resources: [String],
    featured: { type: Boolean, default: false },
    enrollmentStatus: {
      type: String,
      enum: ["open", "closed", "waitlist"],
      default: "open",
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    publishedToWebsite: { type: Boolean, default: false },
    metaTitle: String,
    metaDescription: String,
  },
  { timestamps: true }
);

export const Course: Model<ICourse> =
  mongoose.models.Course ?? mongoose.model<ICourse>("Course", CourseSchema);

export interface IEnrollment extends Document {
  courseId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  progress: number;
  completedLessons: mongoose.Types.ObjectId[];
  paymentStatus: "free" | "pending" | "paid" | "failed" | "refunded";
  stripeSessionId?: string;
  status: "active" | "completed" | "cancelled";
  enrolledAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentSchema = new Schema<IEnrollment>(
  {
    courseId: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    progress: { type: Number, default: 0 },
    completedLessons: [{ type: Schema.Types.ObjectId }],
    paymentStatus: {
      type: String,
      enum: ["free", "pending", "paid", "failed", "refunded"],
      default: "free",
    },
    stripeSessionId: String,
    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
    enrolledAt: { type: Date, default: Date.now },
    completedAt: Date,
  },
  { timestamps: true }
);

EnrollmentSchema.index({ courseId: 1, userId: 1 }, { unique: true });

export const Enrollment: Model<IEnrollment> =
  mongoose.models.Enrollment ??
  mongoose.model<IEnrollment>("Enrollment", EnrollmentSchema);
