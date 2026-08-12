import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IProgramSection {
  _id?: mongoose.Types.ObjectId;
  title: string;
  content: string;
  order: number;
}

export interface IProgram extends Document {
  title: string;
  slug: string;
  tagline: string;
  shortDescription: string;
  heroImage?: string;
  gallery: string[];
  overview: string;
  benefits: string[];
  ageRange?: string;
  activities: string[];
  schedule?: string;
  faqs: { question: string; answer: string }[];
  detailSections: IProgramSection[];
  listingOrder: number;
  featured: boolean;
  status: "draft" | "published" | "archived";
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProgramSectionSchema = new Schema<IProgramSection>(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const ProgramSchema = new Schema<IProgram>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    tagline: { type: String, required: true },
    shortDescription: { type: String, required: true },
    heroImage: String,
    gallery: [String],
    overview: { type: String, required: true },
    benefits: [String],
    ageRange: String,
    activities: [String],
    schedule: String,
    faqs: [{ question: String, answer: String }],
    detailSections: [ProgramSectionSchema],
    listingOrder: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    metaTitle: String,
    metaDescription: String,
  },
  { timestamps: true }
);

export const Program: Model<IProgram> =
  mongoose.models.Program ?? mongoose.model<IProgram>("Program", ProgramSchema);

export interface IServiceRequest extends Document {
  programId: mongoose.Types.ObjectId;
  programSlug: string;
  parentName: string;
  email: string;
  phone: string;
  studentName: string;
  studentAge?: string;
  preferredSchedule?: string;
  requestType: "individual" | "group";
  schoolStatus?: "homeschool" | "traditional" | "other";
  goals?: string;
  accessibilityNeeds?: string;
  additionalNotes?: string;
  consentGiven: boolean;
  status: "new" | "contacted" | "scheduled" | "completed" | "declined";
  assignedTo?: mongoose.Types.ObjectId;
  privateNotes?: string;
  followUpDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ServiceRequestSchema = new Schema<IServiceRequest>(
  {
    programId: { type: Schema.Types.ObjectId, ref: "Program", required: true },
    programSlug: { type: String, required: true },
    parentName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    studentName: { type: String, required: true },
    studentAge: String,
    preferredSchedule: String,
    requestType: { type: String, enum: ["individual", "group"], default: "individual" },
    schoolStatus: { type: String, enum: ["homeschool", "traditional", "other"] },
    goals: String,
    accessibilityNeeds: String,
    additionalNotes: String,
    consentGiven: { type: Boolean, required: true },
    status: {
      type: String,
      enum: ["new", "contacted", "scheduled", "completed", "declined"],
      default: "new",
    },
    assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
    privateNotes: String,
    followUpDate: Date,
  },
  { timestamps: true }
);

export const ServiceRequest: Model<IServiceRequest> =
  mongoose.models.ServiceRequest ??
  mongoose.model<IServiceRequest>("ServiceRequest", ServiceRequestSchema);
