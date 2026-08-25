import mongoose, { Schema, type Document, type Model } from "mongoose";
import { generateEventRegistrationId } from "@/lib/events/generate-registration-id";
import type { EventPackage, EventRegistrationLineItem } from "@/lib/events/packages";

export interface IEvent extends Document {
  title: string;
  slug: string;
  shortDescription: string;
  fullDescription: string;
  coverImage?: string;
  gallery: string[];
  startDate: Date;
  endDate: Date;
  startTime: string;
  endTime: string;
  timezone: string;
  location: string;
  mapLink?: string;
  isOnline: boolean;
  capacity?: number;
  registrationDeadline?: Date;
  ageRange?: string;
  grade?: string;
  parentRequired: boolean;
  whatToBring?: string;
  instructions?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  eventType: "free" | "paid";
  priceAmount: number;
  packages: EventPackage[];
  registrationEnabled: boolean;
  featured: boolean;
  category?: string;
  status: "draft" | "published" | "cancelled" | "completed" | "archived";
  publishedToWebsite: boolean;
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
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    timezone: { type: String, default: "America/New_York" },
    location: { type: String, required: true },
    mapLink: String,
    isOnline: { type: Boolean, default: false },
    capacity: Number,
    registrationDeadline: Date,
    ageRange: String,
    grade: String,
    parentRequired: { type: Boolean, default: false },
    whatToBring: String,
    instructions: String,
    contactName: String,
    contactEmail: String,
    contactPhone: String,
    eventType: { type: String, enum: ["free", "paid"], default: "free" },
    priceAmount: { type: Number, default: 0 },
    packages: {
      type: [
        {
          id: { type: String, required: true },
          name: { type: String, required: true },
          description: String,
          imageUrl: String,
          priceAmount: { type: Number, default: 0 },
          itemType: { type: String, enum: ["package", "addon"], default: "package" },
          enabled: { type: Boolean, default: true },
          sortOrder: { type: Number, default: 0 },
        },
      ],
      default: [],
    },
    registrationEnabled: { type: Boolean, default: true },
    featured: { type: Boolean, default: false },
    category: String,
    status: {
      type: String,
      enum: ["draft", "published", "cancelled", "completed", "archived"],
      default: "draft",
    },
    publishedToWebsite: { type: Boolean, default: false },
    metaTitle: String,
    metaDescription: String,
  },
  { timestamps: true }
);

EventSchema.index({ startDate: 1, status: 1 });

export const Event: Model<IEvent> =
  mongoose.models.Event ?? mongoose.model<IEvent>("Event", EventSchema);

export interface IEventRegistration extends Document {
  eventId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  registrationId: string;
  
  // Student Information
  studentName: string;
  studentAge?: number;
  studentGrade?: string;
  studentDateOfBirth?: Date;
  
  // Parent/Guardian Information
  guardianName: string;
  guardianEmail: string;
  guardianPhone: string;
  guardianRelationship?: string;
  
  // Emergency Contact
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelationship?: string;
  
  // Medical Information
  medicalConditions?: string;
  allergies?: string;
  medications?: string;
  
  // Registration Details
  registrationType: "free" | "paid";
  paymentStatus: "free" | "pending" | "paid" | "failed" | "refunded";
  paymentAmount?: number;
  lineItems: EventRegistrationLineItem[];
  stripeSessionId?: string;
  
  // Custom Questions/Options
  customResponses?: Record<string, unknown>;
  
  // Status
  status: "pending" | "confirmed" | "cancelled" | "waitlist";
  checkedIn: boolean;
  checkedInAt?: Date;
  
  // Communication
  confirmationEmailSent: boolean;
  confirmationEmailSentAt?: Date;
  
  // Admin Notes
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const EventRegistrationSchema = new Schema<IEventRegistration>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    registrationId: { type: String, required: true, unique: true },
    
    // Student Information
    studentName: { type: String, required: true },
    studentAge: Number,
    studentGrade: String,
    studentDateOfBirth: Date,
    
    // Parent/Guardian Information
    guardianName: { type: String, required: true },
    guardianEmail: { type: String, required: true },
    guardianPhone: { type: String, required: true },
    guardianRelationship: String,
    
    // Emergency Contact
    emergencyContactName: String,
    emergencyContactPhone: String,
    emergencyContactRelationship: String,
    
    // Medical Information
    medicalConditions: String,
    allergies: String,
    medications: String,
    
    // Registration Details
    registrationType: {
      type: String,
      enum: ["free", "paid"],
      default: "free",
    },
    paymentStatus: {
      type: String,
      enum: ["free", "pending", "paid", "failed", "refunded"],
      default: "free",
    },
    paymentAmount: Number,
    lineItems: {
      type: [
        {
          packageId: { type: String, required: true },
          name: { type: String, required: true },
          priceAmount: { type: Number, required: true },
          quantity: { type: Number, required: true, min: 1 },
          imageUrl: String,
          itemType: { type: String, enum: ["package", "addon"] },
        },
      ],
      default: [],
    },
    stripeSessionId: String,
    
    // Custom Questions/Options
    customResponses: Schema.Types.Mixed,
    
    // Status
    status: {
      type: String,
      enum: ["pending", "confirmed", "cancelled", "waitlist"],
      default: "confirmed",
    },
    checkedIn: { type: Boolean, default: false },
    checkedInAt: Date,
    
    // Communication
    confirmationEmailSent: { type: Boolean, default: false },
    confirmationEmailSentAt: Date,
    
    // Admin Notes
    notes: String,
  },
  { timestamps: true }
);

EventRegistrationSchema.index({ eventId: 1, userId: 1 });
EventRegistrationSchema.index({ guardianEmail: 1 });
EventRegistrationSchema.index({ guardianPhone: 1 });

// Generate unique registration ID before validation
EventRegistrationSchema.pre("validate", function () {
  if (!this.registrationId) {
    this.registrationId = generateEventRegistrationId();
  }
});

export const EventRegistration: Model<IEventRegistration> =
  mongoose.models.EventRegistration ??
  mongoose.model<IEventRegistration>("EventRegistration", EventRegistrationSchema);
