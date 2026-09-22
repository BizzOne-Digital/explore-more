import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ISiteTrafficDaily extends Document {
  /** UTC calendar day (midnight UTC). */
  day: Date;
  /** Normalized path bucket from normalizeAnalyticsPath. */
  path: string;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

const SiteTrafficDailySchema = new Schema<ISiteTrafficDaily>(
  {
    day: { type: Date, required: true },
    path: { type: String, required: true, trim: true },
    views: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

SiteTrafficDailySchema.index({ day: 1, path: 1 }, { unique: true });
SiteTrafficDailySchema.index({ day: -1 });

export const SiteTrafficDaily: Model<ISiteTrafficDaily> =
  mongoose.models.SiteTrafficDaily ??
  mongoose.model<ISiteTrafficDaily>("SiteTrafficDaily", SiteTrafficDailySchema);
