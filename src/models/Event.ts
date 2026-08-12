import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IEvent extends Document {
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  coverImage?: string;
  gallery: string[];
  startDate: Date;
  endDate: Date;
  timezone: string;
  location: string;
  mapLink?: string;
  isOnline: boolean;
  capacity?: number;
  registrationDeadline?: Date;
  ageRange?: string;
  parentRequired: boolean;
  whatToBring?: string;
  priceCents: number;
  registrationEnabled: boolean;
  featured: boolean;
  category?: string;
  status: "draft" | "published" | "cancelled" | "completed" | "archived";
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    shortDescription: { type: String, required: true },
    fullDescription: { type: String, required: true },
    coverImage: String,
    gallery: [String],
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    timezone: { type: String, default: "America/New_York" },
    location: { type: String, required: true },
    mapLink: String,
    isOnline: { type: Boolean, default: false },
    capacity: Number,
    registrationDeadline: Date,
    ageRange: String,
    parentRequired: { type: Boolean, default: false },
    whatToBring: String,
    priceCents: { type: Number, default: 0 },
    registrationEnabled: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    category: String,
    status: {
      type: String,
      enum: ["draft", "published", "cancelled", "completed", "archived"],
      default: "draft",
    },
    metaTitle: String,
    metaDescription: String,
  },
  { timestamps: true }
);

EventSchema.index({ startDate: 1, status: 1 });
EventSchema.index({ slug: 1 });

export const Event: Model<IEvent> =
  mongoose.models.Event ?? mongoose.model<IEvent>("Event", EventSchema);

export interface IEventRegistration extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  studentName: string;
  studentAge?: number;
  guardianName?: string;
  guardianEmail?: string;
  guardianPhone?: string;
  consentGiven: boolean;
  paymentStatus: "free" | "pending" | "paid" | "failed" | "refunded";
  stripeSessionId?: string;
  checkedIn: boolean;
  checkedInAt?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const EventRegistrationSchema = new Schema<IEventRegistration>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    studentName: { type: String, required: true },
    studentAge: Number,
    guardianName: String,
    guardianEmail: String,
    guardianPhone: String,
    consentGiven: { type: Boolean, default: false },
    paymentStatus: {
      type: String,
      enum: ["free", "pending", "paid", "failed", "refunded"],
      default: "free",
    },
    stripeSessionId: String,
    checkedIn: { type: Boolean, default: false },
    checkedInAt: Date,
    notes: String,
  },
  { timestamps: true }
);

EventRegistrationSchema.index({ eventId: 1, userId: 1 });

export const EventRegistration: Model<IEventRegistration> =
  mongoose.models.EventRegistration ??
  mongoose.model<IEventRegistration>("EventRegistration", EventRegistrationSchema);
