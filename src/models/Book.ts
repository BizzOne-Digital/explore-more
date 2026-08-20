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
  priceAmount: number;
  salePriceAmount?: number;
  isbn?: string;
  format?: string;
  pageCount?: number;
  ageRange?: string;
  stockStatus: "in_stock" | "low_stock" | "out_of_stock";
  inventory: number;
  featured: boolean;
  category?: string;
  status: "draft" | "published" | "archived";
  publishedToWebsite: boolean;
  metaTitle?: string;
  metaDescription?: string;
  digitalFile?: {
    enabled: boolean;
    storage?: "r2" | "local";
    r2Key?: string;
    localPath?: string;
    fileName: string;
    fileSizeBytes: number;
    fileType: string;
    uploadedAt: Date;
  };
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
    priceAmount: { type: Number, required: true, default: 0 },
    salePriceAmount: Number,
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
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    publishedToWebsite: { type: Boolean, default: false },
    metaTitle: String,
    metaDescription: String,
    digitalFile: {
      enabled: { type: Boolean, default: false },
      storage: { type: String, enum: ["r2", "local"] },
      r2Key: String,
      localPath: String,
      fileName: String,
      fileSizeBytes: Number,
      fileType: String,
      uploadedAt: Date,
    },
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

export interface IOrderModificationRequest extends Document {
  orderId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  requestType: "add_item" | "remove_item" | "cancel_order" | "change_address";
  status: "pending" | "approved" | "rejected";
  requestDetails: {
    itemsToAdd?: Array<{
      bookId: mongoose.Types.ObjectId;
      title: string;
      quantity: number;
    }>;
    itemsToRemove?: mongoose.Types.ObjectId[];
    newAddress?: {
      name: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    reason?: string;
  };
  adminNotes?: string;
  processedBy?: mongoose.Types.ObjectId;
  processedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const OrderModificationRequestSchema = new Schema<IOrderModificationRequest>(
  {
    orderId: { type: Schema.Types.ObjectId, ref: "Order", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    requestType: {
      type: String,
      enum: ["add_item", "remove_item", "cancel_order", "change_address"],
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    requestDetails: {
      itemsToAdd: [
        {
          bookId: { type: Schema.Types.ObjectId, ref: "Book" },
          title: String,
          quantity: Number,
        },
      ],
      itemsToRemove: [{ type: Schema.Types.ObjectId }],
      newAddress: {
        name: String,
        line1: String,
        line2: String,
        city: String,
        state: String,
        postalCode: String,
        country: String,
      },
      reason: String,
    },
    adminNotes: String,
    processedBy: { type: Schema.Types.ObjectId, ref: "User" },
    processedAt: Date,
  },
  { timestamps: true }
);

export const OrderModificationRequest: Model<IOrderModificationRequest> =
  mongoose.models.OrderModificationRequest ??
  mongoose.model<IOrderModificationRequest>("OrderModificationRequest", OrderModificationRequestSchema);
