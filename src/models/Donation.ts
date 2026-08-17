import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IDonationCampaign extends Document {
  title: string;
  slug: string;
  description: string;
  coverImage?: string;
  gallery: string[];
  goalAmount: number;
  raisedAmount: number;
  suggestedAmounts: number[];
  customAmountEnabled: boolean;
  startDate?: Date;
  endDate?: Date;
  callToAction?: string;
  campaignInfo?: string;
  status: "draft" | "published" | "completed" | "archived";
  publishedToWebsite: boolean;
  featured: boolean;
  showDonorCount: boolean;
  allowAnonymous: boolean;
  updates: { date: Date; title: string; content: string }[];
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DonationCampaignSchema = new Schema<IDonationCampaign>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    coverImage: String,
    gallery: [String],
    goalAmount: { type: Number, required: true, default: 0 },
    raisedAmount: { type: Number, default: 0 },
    suggestedAmounts: [Number],
    customAmountEnabled: { type: Boolean, default: true },
    startDate: Date,
    endDate: Date,
    callToAction: String,
    campaignInfo: String,
    status: {
      type: String,
      enum: ["draft", "published", "completed", "archived"],
      default: "draft",
    },
    publishedToWebsite: { type: Boolean, default: false },
    featured: { type: Boolean, default: false },
    showDonorCount: { type: Boolean, default: true },
    allowAnonymous: { type: Boolean, default: true },
    updates: [{ date: Date, title: String, content: String }],
    metaTitle: String,
    metaDescription: String,
  },
  { timestamps: true }
);

export const DonationCampaign: Model<IDonationCampaign> =
  mongoose.models.DonationCampaign ??
  mongoose.model<IDonationCampaign>("DonationCampaign", DonationCampaignSchema);

export interface IDonation extends Document {
  campaignId: mongoose.Types.ObjectId;
  userId?: mongoose.Types.ObjectId;
  amountCents: number;
  donorName: string;
  donorEmail: string;
  isAnonymous: boolean;
  message?: string;
  paymentStatus: "pending" | "paid" | "failed" | "refunded";
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  receiptSent: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DonationSchema = new Schema<IDonation>(
  {
    campaignId: { type: Schema.Types.ObjectId, ref: "DonationCampaign", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    amountCents: { type: Number, required: true },
    donorName: { type: String, required: true },
    donorEmail: { type: String, required: true },
    isAnonymous: { type: Boolean, default: false },
    message: String,
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
    },
    stripeSessionId: String,
    stripePaymentIntentId: String,
    receiptSent: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Donation: Model<IDonation> =
  mongoose.models.Donation ?? mongoose.model<IDonation>("Donation", DonationSchema);
