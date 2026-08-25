import mongoose, { Schema, type Document, type Model } from "mongoose";

export type SponsorStatus = "lead" | "prospect" | "active" | "major" | "lapsed" | "inactive";
export type SponsorType = "individual" | "business" | "foundation" | "church" | "other";
export type SponsorSource = "website" | "referral" | "event" | "manual" | "other";

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
  nextFollowUpAt?: Date;
  totalDonatedCents: number;
  donationCount: number;
  firstDonationAt?: Date;
  lastDonationAt?: Date;
  userId?: mongoose.Types.ObjectId;
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
    nextFollowUpAt: Date,
    totalDonatedCents: { type: Number, default: 0 },
    donationCount: { type: Number, default: 0 },
    firstDonationAt: Date,
    lastDonationAt: Date,
    userId: { type: Schema.Types.ObjectId, ref: "User" },
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
