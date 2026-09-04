import mongoose, { Schema, type Document, type Model } from "mongoose";

export interface ISubscriptionPlan extends Document {
  name: string;
  slug: string;
  description?: string;
  priceCents: number;
  interval: "month" | "year";
  stripePriceId?: string;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionPlanSchema = new Schema<ISubscriptionPlan>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    priceCents: { type: Number, required: true },
    interval: { type: String, enum: ["month", "year"], default: "month" },
    stripePriceId: String,
    features: [String],
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export const SubscriptionPlan: Model<ISubscriptionPlan> =
  mongoose.models.SubscriptionPlan ??
  mongoose.model<ISubscriptionPlan>("SubscriptionPlan", SubscriptionPlanSchema);

export type SubscriptionStatus =
  | "active"
  | "trialing"
  | "past_due"
  | "canceled"
  | "paused"
  | "none";

export interface IParentSubscription extends Document {
  userId: mongoose.Types.ObjectId;
  planId?: mongoose.Types.ObjectId;
  status: SubscriptionStatus;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  discountPercent: number;
  creditCents: number;
  adminNotes?: string;
  pendingPlanId?: mongoose.Types.ObjectId;
  pendingPlanEffectiveAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ParentSubscriptionSchema = new Schema<IParentSubscription>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    planId: { type: Schema.Types.ObjectId, ref: "SubscriptionPlan" },
    status: {
      type: String,
      enum: ["active", "trialing", "past_due", "canceled", "paused", "none"],
      default: "none",
    },
    stripeSubscriptionId: String,
    stripePriceId: String,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: { type: Boolean, default: false },
    discountPercent: { type: Number, default: 0 },
    creditCents: { type: Number, default: 0 },
    adminNotes: String,
    pendingPlanId: { type: Schema.Types.ObjectId, ref: "SubscriptionPlan" },
    pendingPlanEffectiveAt: Date,
  },
  { timestamps: true }
);

export const ParentSubscription: Model<IParentSubscription> =
  mongoose.models.ParentSubscription ??
  mongoose.model<IParentSubscription>("ParentSubscription", ParentSubscriptionSchema);

export interface IPendingMembership extends Document {
  email: string;
  planId: mongoose.Types.ObjectId;
  stripeSubscriptionId: string;
  stripeCustomerId?: string;
  stripePriceId?: string;
  currentPeriodEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PendingMembershipSchema = new Schema<IPendingMembership>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    planId: { type: Schema.Types.ObjectId, ref: "SubscriptionPlan", required: true },
    stripeSubscriptionId: { type: String, required: true },
    stripeCustomerId: String,
    stripePriceId: String,
    currentPeriodEnd: Date,
  },
  { timestamps: true }
);

export const PendingMembership: Model<IPendingMembership> =
  mongoose.models.PendingMembership ??
  mongoose.model<IPendingMembership>("PendingMembership", PendingMembershipSchema);

export interface IPaymentMethodSnapshot {
  brand: string;
  last4: string;
  expMonth?: number;
  expYear?: number;
}
