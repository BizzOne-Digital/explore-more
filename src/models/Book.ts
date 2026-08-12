import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface IBook extends Document {
  title: string;
  slug: string;
  author: string;
  subtitle?: string;
  coverImage?: string;
  images: string[];
  shortDescription: string;
  fullDescription: string;
  priceCents: number;
  salePriceCents?: number;
  isbn?: string;
  format?: string;
  pageCount?: number;
  ageRange?: string;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
  inventory: number;
  featured: boolean;
  category?: string;
  published: boolean;
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BookSchema = new Schema<IBook>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    author: { type: String, required: true },
    subtitle: String,
    coverImage: String,
    images: [String],
    shortDescription: { type: String, required: true },
    fullDescription: { type: String, required: true },
    priceCents: { type: Number, required: true },
    salePriceCents: Number,
    isbn: String,
    format: String,
    pageCount: Number,
    ageRange: String,
    stockStatus: {
      type: String,
      enum: ["in_stock", "low_stock", "out_of_stock"],
      default: "in_stock",
    },
    inventory: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    category: String,
    published: { type: Boolean, default: false },
    metaTitle: String,
    metaDescription: String,
  },
  { timestamps: true }
);

export const Book: Model<IBook> =
  mongoose.models.Book ?? mongoose.model<IBook>("Book", BookSchema);

export interface IOrderItem {
  bookId: mongoose.Types.ObjectId;
  title: string;
  quantity: number;
  priceCents: number;
}

export interface IOrder extends Document {
  userId?: mongoose.Types.ObjectId;
  orderNumber: string;
  items: IOrderItem[];
  subtotalCents: number;
  taxCents: number;
  shippingCents: number;
  totalCents: number;
  paymentStatus: "pending" | "paid" | "failed" | "refunded" | "manual";
  stripeSessionId?: string;
  stripePaymentIntentId?: string;
  shippingAddress: {
    name: string;
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  customerEmail: string;
  customerName: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderSchema = new Schema<IOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    orderNumber: { type: String, required: true, unique: true },
    items: [
      {
        bookId: { type: Schema.Types.ObjectId, ref: "Book" },
        title: String,
        quantity: Number,
        priceCents: Number,
      },
    ],
    subtotalCents: { type: Number, required: true },
    taxCents: { type: Number, default: 0 },
    shippingCents: { type: Number, default: 0 },
    totalCents: { type: Number, required: true },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded", "manual"],
      default: "pending",
    },
    stripeSessionId: String,
    stripePaymentIntentId: String,
    shippingAddress: {
      name: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: { type: String, default: "US" },
    },
    customerEmail: { type: String, required: true },
    customerName: { type: String, required: true },
  },
  { timestamps: true }
);

export const Order: Model<IOrder> =
  mongoose.models.Order ?? mongoose.model<IOrder>("Order", OrderSchema);
