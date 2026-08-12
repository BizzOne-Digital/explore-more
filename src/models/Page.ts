import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IPageSection {
  _id?: mongoose.Types.ObjectId;
  internalName: string;
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  body?: string;
  ctaLabel?: string;
  ctaLink?: string;
  image?: string;
  imageAlt?: string;
  backgroundImage?: string;
  mobileImage?: string;
  theme?: string;
  alignment?: "left" | "center" | "right";
  visible: boolean;
  order: number;
  status: "draft" | "published";
}

export interface IPage extends Document {
  key: string;
  title: string;
  slug: string;
  metaTitle?: string;
  metaDescription?: string;
  sections: IPageSection[];
  status: "draft" | "published";
  createdAt: Date;
  updatedAt: Date;
}

const PageSectionSchema = new Schema<IPageSection>(
  {
    internalName: { type: String, required: true },
    eyebrow: String,
    heading: String,
    subheading: String,
    body: String,
    ctaLabel: String,
    ctaLink: String,
    image: String,
    imageAlt: String,
    backgroundImage: String,
    mobileImage: String,
    theme: String,
    alignment: { type: String, enum: ["left", "center", "right"], default: "left" },
    visible: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { _id: true }
);

const PageSchema = new Schema<IPage>(
  {
    key: { type: String, required: true, unique: true },
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    metaTitle: String,
    metaDescription: String,
    sections: [PageSectionSchema],
    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true }
);

export const Page: Model<IPage> =
  mongoose.models.Page ?? mongoose.model<IPage>("Page", PageSchema);

export interface ISiteSettings extends Document {
  logoUrl?: string;
  logoDarkUrl?: string;
  faviconUrl?: string;
  companyName: string;
  email: string;
  phone: string;
  address?: string;
  operatingHours?: string;
  socialLinks: { platform: string; url: string }[];
  stripeEnabled: boolean;
  manualOrderMode: boolean;
  taxRatePercent: number;
  shippingFlatCents: number;
  freeShippingThresholdCents: number;
  smtpConfigured: boolean;
  introEnabled: boolean;
  verifiedStats: {
    students?: number;
    adventures?: number;
    partners?: number;
    showStats: boolean;
  };
  upcomingEventLink?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SiteSettingsSchema = new Schema<ISiteSettings>(
  {
    logoUrl: String,
    logoDarkUrl: String,
    faviconUrl: String,
    companyName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: String,
    operatingHours: String,
    socialLinks: [{ platform: String, url: String }],
    stripeEnabled: { type: Boolean, default: false },
    manualOrderMode: { type: Boolean, default: false },
    taxRatePercent: { type: Number, default: 0 },
    shippingFlatCents: { type: Number, default: 0 },
    freeShippingThresholdCents: { type: Number, default: 0 },
    smtpConfigured: { type: Boolean, default: false },
    introEnabled: { type: Boolean, default: true },
    verifiedStats: {
      students: Number,
      adventures: Number,
      partners: Number,
      showStats: { type: Boolean, default: false },
    },
    upcomingEventLink: String,
  },
  { timestamps: true }
);

export const SiteSettings: Model<ISiteSettings> =
  mongoose.models.SiteSettings ??
  mongoose.model<ISiteSettings>("SiteSettings", SiteSettingsSchema);
