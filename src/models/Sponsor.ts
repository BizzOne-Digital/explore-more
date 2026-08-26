import mongoose, { Schema, type Document, type Model } from "mongoose";

export type SponsorStatus = "lead" | "prospect" | "active" | "major" | "lapsed" | "inactive";
export type SponsorType = "individual" | "business" | "foundation" | "church" | "other";
export type SponsorSource = "website" | "referral" | "event" | "manual" | "other";

export interface ISponsorContract {
  path: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: Date;
  uploadedByName?: string;
}

export interface ISponsor extends Document {
  name: string;
  email: string;
  phone?: string;
  organization?: string;
  status: SponsorStatus;
  type: SponsorType;
  source: SponsorSource;
  tags: string[];
  adminNotes?: string;
  contractNotes?: string;
  contract?: ISponsorContract;
  nextFollowUpAt?: Date;
  totalDonatedCents: number;
  donationCount: number;
  firstDonationAt?: Date;
  lastDonationAt?: Date;
  userId?: mongoose.Types.ObjectId;
  accountManagerId?: mongoose.Types.ObjectId;
  accountManagerName?: string;
  accountManagerStaffId?: string;
  address?: {
    line1?: string;
    line2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const SponsorSchema = new Schema<ISponsor>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: String,
    organization: String,
    status: {
      type: String,
      enum: ["lead", "prospect", "active", "major", "lapsed", "inactive"],
      default: "lead",
    },
    type: {
      type: String,
      enum: ["individual", "business", "foundation", "church", "other"],
      default: "individual",
    },
    source: {
      type: String,
      enum: ["website", "referral", "event", "manual", "other"],
      default: "manual",
    },
    tags: [String],
    adminNotes: String,
    contractNotes: String,
    contract: {
      path: String,
      fileName: String,
      mimeType: String,
      size: Number,
      uploadedAt: Date,
      uploadedByName: String,
    },
    nextFollowUpAt: Date,
    totalDonatedCents: { type: Number, default: 0 },
    donationCount: { type: Number, default: 0 },
    firstDonationAt: Date,
    lastDonationAt: Date,
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    accountManagerId: { type: Schema.Types.ObjectId, ref: "User" },
    accountManagerName: String,
    accountManagerStaffId: String,
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
  },
  { timestamps: true }
);

SponsorSchema.index({ status: 1, lastDonationAt: -1 });
SponsorSchema.index({ accountManagerId: 1 });
SponsorSchema.index({ name: "text", email: "text", organization: "text" });
SponsorSchema.index({ nextFollowUpAt: 1 });

export const Sponsor: Model<ISponsor> =
  mongoose.models.Sponsor ?? mongoose.model<ISponsor>("Sponsor", SponsorSchema);

export type SponsorNoteType = "call" | "email" | "meeting" | "note" | "follow_up";

export interface ISponsorNote extends Document {
  sponsorId: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  staffName: string;
  type: SponsorNoteType;
  subject: string;
  content: string;
  followUpDate?: Date;
  followUpCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const SponsorNoteSchema = new Schema<ISponsorNote>(
  {
    sponsorId: { type: Schema.Types.ObjectId, ref: "Sponsor", required: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    staffName: { type: String, required: true },
    type: {
      type: String,
      enum: ["call", "email", "meeting", "note", "follow_up"],
      default: "note",
    },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    followUpDate: Date,
    followUpCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

SponsorNoteSchema.index({ sponsorId: 1, createdAt: -1 });
SponsorNoteSchema.index({ followUpDate: 1, followUpCompleted: 1 });

export const SponsorNote: Model<ISponsorNote> =
  mongoose.models.SponsorNote ??
  mongoose.model<ISponsorNote>("SponsorNote", SponsorNoteSchema);

export type SponsorContributionMethod =
  | "check"
  | "cash"
  | "card_phone"
  | "ach"
  | "online"
  | "other";

export interface ISponsorContribution extends Document {
  sponsorId: mongoose.Types.ObjectId;
  amountCents: number;
  paymentMethod: SponsorContributionMethod;
  paymentStatus: "paid" | "pending" | "refunded";
  programId?: mongoose.Types.ObjectId;
  programTitle?: string;
  notes?: string;
  recordedBy: mongoose.Types.ObjectId;
  recordedByName: string;
  contributionDate: Date;
  donationId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SponsorContributionSchema = new Schema<ISponsorContribution>(
  {
    sponsorId: { type: Schema.Types.ObjectId, ref: "Sponsor", required: true, index: true },
    amountCents: { type: Number, required: true, min: 1 },
    paymentMethod: {
      type: String,
      enum: ["check", "cash", "card_phone", "ach", "online", "other"],
      default: "other",
    },
    paymentStatus: {
      type: String,
      enum: ["paid", "pending", "refunded"],
      default: "paid",
    },
    programId: { type: Schema.Types.ObjectId, ref: "Program" },
    programTitle: String,
    notes: String,
    recordedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    recordedByName: { type: String, required: true },
    contributionDate: { type: Date, default: Date.now },
    donationId: { type: Schema.Types.ObjectId, ref: "Donation" },
  },
  { timestamps: true }
);

SponsorContributionSchema.index({ sponsorId: 1, contributionDate: -1 });

export const SponsorContribution: Model<ISponsorContribution> =
  mongoose.models.SponsorContribution ??
  mongoose.model<ISponsorContribution>("SponsorContribution", SponsorContributionSchema);
