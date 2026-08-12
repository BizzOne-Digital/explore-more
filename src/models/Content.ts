import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IGalleryCategory extends Document {
  name: string;
  slug: string;
  description?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const GalleryCategorySchema = new Schema<IGalleryCategory>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const GalleryCategory: Model<IGalleryCategory> =
  mongoose.models.GalleryCategory ??
  mongoose.model<IGalleryCategory>("GalleryCategory", GalleryCategorySchema);

export interface IGalleryImage extends Document {
  title: string;
  caption?: string;
  imageUrl: string;
  altText?: string;
  categoryId?: mongoose.Types.ObjectId;
  featured: boolean;
  order: number;
  status: "draft" | "published";
  createdAt: Date;
  updatedAt: Date;
}

const GalleryImageSchema = new Schema<IGalleryImage>(
  {
    title: { type: String, required: true },
    caption: String,
    imageUrl: { type: String, required: true },
    altText: String,
    categoryId: { type: Schema.Types.ObjectId, ref: "GalleryCategory" },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true }
);

export const GalleryImage: Model<IGalleryImage> =
  mongoose.models.GalleryImage ??
  mongoose.model<IGalleryImage>("GalleryImage", GalleryImageSchema);

export interface ITestimonial extends Document {
  authorName: string;
  authorRole?: string;
  content: string;
  rating?: number;
  imageUrl?: string;
  featured: boolean;
  status: "draft" | "published";
  createdAt: Date;
  updatedAt: Date;
}

const TestimonialSchema = new Schema<ITestimonial>(
  {
    authorName: { type: String, required: true },
    authorRole: String,
    content: { type: String, required: true },
    rating: { type: Number, min: 1, max: 5 },
    imageUrl: String,
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true }
);

export const Testimonial: Model<ITestimonial> =
  mongoose.models.Testimonial ??
  mongoose.model<ITestimonial>("Testimonial", TestimonialSchema);

export interface IFAQ extends Document {
  question: string;
  answer: string;
  category?: string;
  order: number;
  status: "draft" | "published";
  createdAt: Date;
  updatedAt: Date;
}

const FAQSchema = new Schema<IFAQ>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    category: String,
    order: { type: Number, default: 0 },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true }
);

export const FAQ: Model<IFAQ> =
  mongoose.models.FAQ ?? mongoose.model<IFAQ>("FAQ", FAQSchema);

export interface IContactMessage extends Document {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  createdAt: Date;
  updatedAt: Date;
}

const ContactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    subject: String,
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["new", "read", "replied", "archived"],
      default: "new",
    },
  },
  { timestamps: true }
);

export const ContactMessage: Model<IContactMessage> =
  mongoose.models.ContactMessage ??
  mongoose.model<IContactMessage>("ContactMessage", ContactMessageSchema);

export interface INewsletterSubscriber extends Document {
  email: string;
  name?: string;
  verified: boolean;
  verificationToken?: string;
  unsubscribed: boolean;
  unsubscribedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NewsletterSubscriberSchema = new Schema<INewsletterSubscriber>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    name: String,
    verified: { type: Boolean, default: false },
    verificationToken: String,
    unsubscribed: { type: Boolean, default: false },
    unsubscribedAt: Date,
  },
  { timestamps: true }
);

export const NewsletterSubscriber: Model<INewsletterSubscriber> =
  mongoose.models.NewsletterSubscriber ??
  mongoose.model<INewsletterSubscriber>("NewsletterSubscriber", NewsletterSubscriberSchema);

export interface IMessage extends Document {
  recipientId: mongoose.Types.ObjectId;
  senderId?: mongoose.Types.ObjectId;
  subject: string;
  body: string;
  isAnnouncement: boolean;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    senderId: { type: Schema.Types.ObjectId, ref: "User" },
    subject: { type: String, required: true },
    body: { type: String, required: true },
    isAnnouncement: { type: Boolean, default: false },
    read: { type: Boolean, default: false },
    readAt: Date,
  },
  { timestamps: true }
);

MessageSchema.index({ recipientId: 1, read: 1 });

export const Message: Model<IMessage> =
  mongoose.models.Message ?? mongoose.model<IMessage>("Message", MessageSchema);
