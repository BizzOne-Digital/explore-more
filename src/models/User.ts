import mongoose, { Schema, type Document, type Model } from "mongoose";
import type { Role } from "@/lib/constants";

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  studentId?: string;
  staffId?: string;
  tutorId?: string;
  guardianId?: string;
  stripeCustomerId?: string;
  emailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  avatar?: string;
  phone?: string;
  notificationPreferences: {
    events: boolean;
    courses: boolean;
    newsletter: boolean;
    announcements: boolean;
  };
  loginAttempts: number;
  lockUntil?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ["student", "parent", "staff", "instructor", "administrator"],
      required: true,
    },
    studentId: { type: String, unique: true, sparse: true },
    staffId: { type: String, unique: true, sparse: true },
    tutorId: { type: String, unique: true, sparse: true },
    guardianId: { type: String, unique: true, sparse: true },
    stripeCustomerId: { type: String, unique: true, sparse: true },
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    emailVerificationExpires: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    avatar: String,
    phone: String,
    notificationPreferences: {
      events: { type: Boolean, default: true },
      courses: { type: Boolean, default: true },
      newsletter: { type: Boolean, default: false },
      announcements: { type: Boolean, default: true },
    },
    loginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

UserSchema.index({ role: 1 });

// Auto-generate IDs based on role
UserSchema.pre("save", async function () {
  if (this.role === "student" && !this.studentId) {
    const { generateUniqueStudentId } = await import("@/lib/students/id");
    this.studentId = await generateUniqueStudentId();
  }

  if (
    (this.role === "administrator" || this.role === "instructor" || this.role === "staff") &&
    !this.staffId
  ) {
    const prefix =
      this.role === "administrator" ? "ADM" : this.role === "instructor" ? "INS" : "STF";
    this.staffId = `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  if (this.role === "parent" && !this.guardianId) {
    const suffix = Math.floor(Math.random() * 900000 + 100000);
    this.guardianId = `PG-${suffix}`;
  }
});

export const User: Model<IUser> =
  mongoose.models.User ?? mongoose.model<IUser>("User", UserSchema);

export interface IStudentProfile extends Document {
  userId: mongoose.Types.ObjectId;
  dateOfBirth?: Date;
  ageRange?: string;
  grade?: string;
  schoolStatus?: "homeschool" | "traditional" | "other";
  bio?: string;
  profileComplete: number;
  emergencyContact?: { name: string; phone: string; relationship: string };
  createdAt: Date;
  updatedAt: Date;
}

const StudentProfileSchema = new Schema<IStudentProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    dateOfBirth: Date,
    ageRange: String,
    grade: String,
    schoolStatus: { type: String, enum: ["homeschool", "traditional", "other"] },
    bio: String,
    profileComplete: { type: Number, default: 0 },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },
  },
  { timestamps: true }
);

export const StudentProfile: Model<IStudentProfile> =
  mongoose.models.StudentProfile ??
  mongoose.model<IStudentProfile>("StudentProfile", StudentProfileSchema);

export interface IGuardianStudentLink extends Document {
  guardianId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  relationship: string;
  status: "pending" | "approved" | "rejected";
  consentGiven: boolean;
  consentDate?: Date;
  approvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const GuardianStudentLinkSchema = new Schema<IGuardianStudentLink>(
  {
    guardianId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    studentId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    relationship: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    consentGiven: { type: Boolean, default: false },
    consentDate: Date,
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

GuardianStudentLinkSchema.index({ guardianId: 1, studentId: 1 }, { unique: true });

export const GuardianStudentLink: Model<IGuardianStudentLink> =
  mongoose.models.GuardianStudentLink ??
  mongoose.model<IGuardianStudentLink>("GuardianStudentLink", GuardianStudentLinkSchema);

export interface IInstructorProfile extends Document {
  userId: mongoose.Types.ObjectId;
  title?: string;
  bio?: string;
  specialties: string[];
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const InstructorProfileSchema = new Schema<IInstructorProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    title: String,
    bio: String,
    specialties: [String],
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const InstructorProfile: Model<IInstructorProfile> =
  mongoose.models.InstructorProfile ??
  mongoose.model<IInstructorProfile>("InstructorProfile", InstructorProfileSchema);

export interface IParentProfile extends Document {
  userId: mongoose.Types.ObjectId;
  firstName?: string;
  lastName?: string;
  mailingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  preferredCommunication?: "email" | "phone" | "text";
  billingName?: string;
  billingEmail?: string;
  billingPhone?: string;
  billingAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  /** Grade of the parent's child (used for assessments and portal filtering). */
  childGrade?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ParentProfileSchema = new Schema<IParentProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    firstName: String,
    lastName: String,
    mailingAddress: {
      street: String,
      city: String,
      state: String,
      zip: String,
    },
    emergencyContact: {
      name: String,
      phone: String,
      relationship: String,
    },
    preferredCommunication: {
      type: String,
      enum: ["email", "phone", "text"],
      default: "email",
    },
    billingName: String,
    billingEmail: String,
    billingPhone: String,
    billingAddress: {
      street: String,
      city: String,
      state: String,
      zip: String,
    },
    childGrade: String,
  },
  { timestamps: true }
);

export const ParentProfile: Model<IParentProfile> =
  mongoose.models.ParentProfile ??
  mongoose.model<IParentProfile>("ParentProfile", ParentProfileSchema);
